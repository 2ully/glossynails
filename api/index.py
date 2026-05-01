from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, field_validator
from mangum import Mangum
import resend
import os
import html

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)

ALLOWED_SERVICES = {
    "Gel Polish – 5 OMR",
    "French Gel – 7 OMR",
    "Normal Extension + Gel Polish – 10 OMR",
    "Normal Extension + French Gel – 12 OMR",
    "Gel Extension – 15 OMR",
    "Gel Extension + French – 17 OMR",
}

class Booking(BaseModel):
    fname: str
    lname: str
    email: EmailStr
    phone: str = ""
    service: str
    date: str
    time: str
    notes: str = ""

    @field_validator("fname", "lname")
    @classmethod
    def name_length(cls, v):
        if len(v) > 50:
            raise ValueError("Too long")
        return v

    @field_validator("phone")
    @classmethod
    def phone_length(cls, v):
        if len(v) > 20:
            raise ValueError("Too long")
        return v

    @field_validator("notes")
    @classmethod
    def notes_length(cls, v):
        if len(v) > 500:
            raise ValueError("Too long")
        return v

    @field_validator("service")
    @classmethod
    def service_allowed(cls, v):
        if v not in ALLOWED_SERVICES:
            raise ValueError("Invalid service")
        return v

@app.post("/api/booking")
async def create_booking(booking: Booking):
    resend.api_key = os.environ["RESEND_API_KEY"]
    owner_email = os.environ["OWNER_EMAIL"]

    fname   = html.escape(booking.fname)
    lname   = html.escape(booking.lname)
    email   = html.escape(booking.email)
    phone   = html.escape(booking.phone) if booking.phone else "—"
    service = html.escape(booking.service)
    date    = html.escape(booking.date)
    time    = html.escape(booking.time)
    notes   = html.escape(booking.notes) if booking.notes else "—"

    # Email to salon owner
    resend.Emails.send({
        "from": "GlossyNails Bookings <onboarding@resend.dev>",
        "to": [owner_email],
        "subject": f"New Booking – {service}",
        "html": f"""
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;">
            <h2 style="color:#c9566e;">New Booking Request 💅</h2>
            <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#7a6b6e;"><strong>Name</strong></td><td>{fname} {lname}</td></tr>
                <tr><td style="padding:8px 0;color:#7a6b6e;"><strong>Email</strong></td><td>{email}</td></tr>
                <tr><td style="padding:8px 0;color:#7a6b6e;"><strong>Phone</strong></td><td>{phone}</td></tr>
                <tr><td style="padding:8px 0;color:#7a6b6e;"><strong>Service</strong></td><td>{service}</td></tr>
                <tr><td style="padding:8px 0;color:#7a6b6e;"><strong>Date</strong></td><td>{date}</td></tr>
                <tr><td style="padding:8px 0;color:#7a6b6e;"><strong>Time</strong></td><td>{time}</td></tr>
                <tr><td style="padding:8px 0;color:#7a6b6e;"><strong>Notes</strong></td><td>{notes}</td></tr>
            </table>
        </div>
        """
    })

    # Confirmation email to customer (best-effort — may fail on free Resend tier)
    try:
        resend.Emails.send({
            "from": "GlossyNails <onboarding@resend.dev>",
            "to": [booking.email],
            "subject": "Your booking request has been received ✨",
            "html": f"""
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;">
                <h2 style="color:#c9566e;">Thank you, {fname}! 💅</h2>
                <p style="color:#7a6b6e;">We've received your booking request and will confirm it shortly.</p>
                <div style="background:#fdf0f2;border-radius:12px;padding:20px;margin:20px 0;">
                    <p><strong>Service:</strong> {service}</p>
                    <p><strong>Date:</strong> {date}</p>
                    <p><strong>Time:</strong> {time}</p>
                </div>
                <p style="color:#7a6b6e;">See you soon! 🌸<br/><strong>GlossyNails Team</strong></p>
            </div>
            """
        })
    except Exception:
        pass

    return {"success": True}

handler = Mangum(app)
