from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mangum import Mangum
import resend
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)

class Booking(BaseModel):
    fname: str
    lname: str
    email: str
    phone: str = ""
    service: str
    date: str
    time: str
    notes: str = ""

@app.post("/api/booking")
async def create_booking(booking: Booking):
    resend.api_key = os.environ["RESEND_API_KEY"]
    owner_email = os.environ["OWNER_EMAIL"]

    # Email to salon owner
    resend.Emails.send({
        "from": "GlossyNails Bookings <onboarding@resend.dev>",
        "to": [owner_email],
        "subject": f"New Booking – {booking.service}",
        "html": f"""
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;">
            <h2 style="color:#c9566e;">New Booking Request 💅</h2>
            <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#7a6b6e;"><strong>Name</strong></td><td>{booking.fname} {booking.lname}</td></tr>
                <tr><td style="padding:8px 0;color:#7a6b6e;"><strong>Email</strong></td><td>{booking.email}</td></tr>
                <tr><td style="padding:8px 0;color:#7a6b6e;"><strong>Phone</strong></td><td>{booking.phone or "—"}</td></tr>
                <tr><td style="padding:8px 0;color:#7a6b6e;"><strong>Service</strong></td><td>{booking.service}</td></tr>
                <tr><td style="padding:8px 0;color:#7a6b6e;"><strong>Date</strong></td><td>{booking.date}</td></tr>
                <tr><td style="padding:8px 0;color:#7a6b6e;"><strong>Time</strong></td><td>{booking.time}</td></tr>
                <tr><td style="padding:8px 0;color:#7a6b6e;"><strong>Notes</strong></td><td>{booking.notes or "—"}</td></tr>
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
                <h2 style="color:#c9566e;">Thank you, {booking.fname}! 💅</h2>
                <p style="color:#7a6b6e;">We've received your booking request and will confirm it shortly.</p>
                <div style="background:#fdf0f2;border-radius:12px;padding:20px;margin:20px 0;">
                    <p><strong>Service:</strong> {booking.service}</p>
                    <p><strong>Date:</strong> {booking.date}</p>
                    <p><strong>Time:</strong> {booking.time}</p>
                </div>
                <p style="color:#7a6b6e;">See you soon! 🌸<br/><strong>GlossyNails Team</strong></p>
            </div>
            """
        })
    except Exception:
        pass

    return {"success": True}

handler = Mangum(app)
