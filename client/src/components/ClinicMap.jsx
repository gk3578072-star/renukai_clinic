import React from "react";
import { MapPin, Phone, Navigation } from "lucide-react";
import "./ClinicMap.css";

const CLINIC = {
  name: "Renukai Dental Clinic",
  address:
    "Shop No. 2, Rudra Plaza, Opposite Ambedkar Market, Behind Telephone Office, Panchmukhi Hanuman Road, Jalgaon, Maharashtra 425001",
  phone: "+91 99708 16550",
};

// Opens a map search centered on the clinic's listed address.
// For a guaranteed exact pin, replace the embed URL with the
// clinic's official Google Maps "Embed a map" URL.
const mapEmbedUrl =
  "https://maps.google.com/maps?q=" +
  encodeURIComponent(
    "Renukai Dental Clinic, Shop No. 2, Rudra Plaza, Opposite Ambedkar Market, Behind Telephone Office, Panchmukhi Hanuman Road, Jalgaon, Maharashtra 425001"
  ) +
  "&z=17&output=embed";

const directionsUrl =
  "https://www.google.com/maps/dir/?api=1&destination=" +
  encodeURIComponent(CLINIC.name + ", " + CLINIC.address);

export default function ClinicMap() {
  return (
    <section className="clinic-map-section" id="location">
      <div className="clinic-map-container">
        <div className="clinic-map-heading">
          <span className="clinic-map-eyebrow">FIND OUR CLINIC</span>
          <h2>
            Visit us for a <em>healthier smile.</em>
          </h2>
          <p>
            Find Renukai Dental Clinic in Jalgaon and plan your visit.
          </p>
        </div>

        <div className="clinic-map-card">
          <div className="clinic-map-frame">
            <iframe
              title="Renukai Dental Clinic location in Jalgaon"
              src={mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="clinic-map-details">
            <span className="clinic-map-pin">
              <MapPin size={24} />
            </span>

            <h3>{CLINIC.name}</h3>

            <div className="clinic-map-info">
              <MapPin size={19} />
              <p>{CLINIC.address}</p>
            </div>

            <a
              className="clinic-map-info clinic-map-phone"
              href="tel:+919970816550"
            >
              <Phone size={19} />
              <span>{CLINIC.phone}</span>
            </a>

            <a
              className="clinic-map-directions"
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation size={18} />
              Get directions
            </a>

            <p className="clinic-map-note">
              Please confirm the map pin before publishing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}