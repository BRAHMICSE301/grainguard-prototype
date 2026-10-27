import streamlit as st
import requests
from datetime import datetime

st.set_page_config(page_title="GrainGuard | Storage Early Warning", page_icon="🌾", layout="wide")

st.markdown("""
<style>
.block-container {padding-top: 1.6rem; max-width: 1100px;}
.hero {padding: 1.2rem 1.4rem; border-radius: 18px; background: linear-gradient(120deg,#eef6e8,#e7f3fb);}
.small-note {font-size: 0.9rem; color: #5f6b63;}
</style>
""", unsafe_allow_html=True)

st.markdown('<div class="hero"><h1>🌾 GrainGuard</h1><h3>Smart Grain Storage Early-Warning System</h3><p>Simple weather-based risk guidance for grain storage. बिना सेंसर के, आसान सलाह।</p></div>', unsafe_allow_html=True)
st.caption("Team Uncharted • CYPHER ’26 / DigiWeek ’26")

with st.sidebar:
    st.header("Farmer details")
    place = st.text_input("Village / town", value="Delhi")
    grain = st.selectbox("Grain type", ["Wheat", "Rice", "Paddy"])
    storage = st.selectbox("Storage type", ["Jute bags", "Bin", "Kothi / room"])
    duration = st.selectbox("How long will it be stored?", ["Less than 2 weeks", "2–8 weeks", "More than 8 weeks"])
    dried = st.radio("Was the grain dried properly before storage?", ["Yes", "No", "Not sure"])
    raised = st.radio("Are bags raised off the floor?", ["Yes", "No", "Not applicable"])
    protected = st.radio("Is the storage area protected from rain/leaks?", ["Yes", "No", "Not sure"])
    language = st.radio("Advice language / सलाह की भाषा", ["English", "हिन्दी"])
    demo_mode = st.checkbox("Use demo weather if location/API fails", value=True)
    run = st.button("Check storage risk / जोखिम जाँचें", type="primary", use_container_width=True)

def get_weather(location):
    geo_url = "https://geocoding-api.open-meteo.com/v1/search"
    geo = requests.get(geo_url, params={"name": location, "count": 1, "language": "en", "format": "json"}, timeout=8)
    geo.raise_for_status()
    results = geo.json().get("results", [])
    if not results:
        raise ValueError("Location not found")
    item = results[0]
    lat, lon = item["latitude"], item["longitude"]
    label = ", ".join(x for x in [item.get("name"), item.get("admin1"), item.get("country")] if x)
    forecast_url = "https://api.open-meteo.com/v1/forecast"
    forecast = requests.get(forecast_url, params={
        "latitude": lat, "longitude": lon,
        "hourly": "relative_humidity_2m,temperature_2m,precipitation,precipitation_probability",
        "forecast_days": 3, "timezone": "auto"
    }, timeout=10)
    forecast.raise_for_status()
    hourly = forecast.json().get("hourly", {})
    humidity = [x for x in hourly.get("relative_humidity_2m", [])[:72] if x is not None]
    temp = [x for x in hourly.get("temperature_2m", [])[:72] if x is not None]
    rain = [x for x in hourly.get("precipitation", [])[:72] if x is not None]
    rain_prob = [x for x in hourly.get("precipitation_probability", [])[:72] if x is not None]
    return {
        "label": label,
        "humidity": max(humidity) if humidity else 0,
        "avg_humidity": sum(humidity)/len(humidity) if humidity else 0,
        "max_temp": max(temp) if temp else 0,
        "rain_mm": sum(rain) if rain else 0,
        "max_rain_prob": max(rain_prob) if rain_prob else 0,
        "demo": False
    }

def demo_weather():
    return {"label": "Demo location (simulated weather)", "humidity": 82, "avg_humidity": 73,
            "max_temp": 29, "rain_mm": 12, "max_rain_prob": 75, "demo": True}

if run:
    weather = None
    error_message = None
    try:
        weather = get_weather(place.strip() or "Delhi")
    except Exception:
        if demo_mode:
            weather = demo_weather()
            error_message = "Live weather could not be loaded, so simulated demo weather is being used."
        else:
            st.error("Could not load weather. Check the location spelling or enable demo weather.")
            st.stop()

    # Illustrative heuristic only. Not a validated grain-moisture or spoilage prediction.
    score = 0
    reasons = []
    if weather["avg_humidity"] >= 70:
        score += 2
        reasons.append("High forecast humidity")
    elif weather["avg_humidity"] >= 60:
        score += 1
        reasons.append("Moderately high forecast humidity")
    if weather["rain_mm"] >= 5 or weather["max_rain_prob"] >= 60:
        score += 2
        reasons.append("Rain is forecast in the next 3 days")
    if storage == "Jute bags":
        score += 1
        reasons.append("Jute bags need protection from damp floors and humid air")
    if dried == "No":
        score += 2
        reasons.append("Grain may not have been dried adequately")
    elif dried == "Not sure":
        score += 1
        reasons.append("Grain dryness is uncertain")
    if raised == "No":
        score += 1
        reasons.append("Bags are placed directly on the floor")
    if protected == "No":
        score += 2
        reasons.append("Storage area may be exposed to rain or leaks")
    elif protected == "Not sure":
        score += 1
        reasons.append("Rain protection is uncertain")
    if duration == "More than 8 weeks":
        score += 1
        reasons.append("Longer storage needs more frequent checks")

    if score <= 2:
        level, color, advice = "LOW", "#dff3e4", [
            "Keep checking for dampness, insects, unusual smell or visible mould.",
            "Keep grain in a clean, dry and well-ventilated storage area."
        ]
    elif score <= 5:
        level, color, advice = "MEDIUM", "#fff0c2", [
            "Raise bags on pallets or a dry platform and keep them away from walls.",
            "Cover grain safely and prevent rainwater from reaching the storage area.",
            "Check the grain and store daily during humid or rainy weather."
        ]
    else:
        level, color, advice = "HIGH", "#f9dada", [
            "Act today: inspect the grain and fix leaks or water entry immediately.",
            "Move bags off damp floors; use a clean, dry, covered location if available.",
            "If grain feels damp or shows mould, seek local agricultural extension advice before mixing or consuming it."
        ]

    st.subheader("Your storage risk / भंडारण जोखिम")
    c1, c2, c3 = st.columns(3)
    c1.metric("Risk level", level)
    c2.metric("Forecast average humidity", f"{weather['avg_humidity']:.0f}%")
    c3.metric("Rainfall forecast (3 days)", f"{weather['rain_mm']:.1f} mm")
    st.markdown(f'<div style="background:{color};padding:1rem 1.2rem;border-radius:14px;"><h2 style="margin:0;">{level} RISK</h2><p style="margin-bottom:0;">This is an illustrative rules-based estimate, not a validated prediction of grain spoilage.</p></div>', unsafe_allow_html=True)

    if error_message:
        st.warning(error_message)
    st.caption(f"Weather location: {weather['label']} • Forecast high rain probability: {weather['max_rain_prob']:.0f}% • Highest forecast temperature: {weather['max_temp']:.1f}°C")

    st.subheader("Why this alert?")
    if reasons:
        for reason in reasons:
            st.write("• " + reason)
    else:
        st.write("• No major risk flags were triggered by the current inputs and forecast.")

    st.subheader("Recommended actions / सुझाए गए कदम")
    if language == "हिन्दी":
        hindi_advice = {
            "LOW": ["नमी, कीड़ों, असामान्य गंध या फफूंदी के संकेत नियमित रूप से जाँचें।", "अनाज को साफ़, सूखी और हवादार जगह पर रखें।"],
            "MEDIUM": ["बोरियों को सूखे प्लेटफॉर्म/पैलेट पर रखें और दीवार से थोड़ी दूरी रखें।", "तिरपाल या सुरक्षित कवर का उपयोग करें और बारिश का पानी अंदर न आने दें।", "नमी या बारिश के दौरान अनाज और भंडारण की रोज़ जाँच करें।"],
            "HIGH": ["आज ही जाँच करें और पानी आने या रिसाव की समस्या ठीक करें।", "बोरियों को गीले फर्श से हटाकर सूखी, ढकी हुई जगह पर रखें।", "अनाज गीला लगे या फफूंदी दिखे तो स्थानीय कृषि विशेषज्ञ से सलाह लें।"]
        }
        for item in hindi_advice[level]:
            st.write("• " + item)
    else:
        for item in advice:
            st.write("• " + item)

    with st.expander("How the score works"):
        st.write("The prototype adds simple points for forecast humidity, rain, storage type, drying, floor contact, rain protection and storage duration. The thresholds are provisional demo rules and must be reviewed with agricultural experts before real-world use.")
        st.write(f"Illustrative score: {score}")

    st.info("This tool uses ambient weather and farmer-reported storage details. It does not measure grain moisture. Always inspect grain directly and follow local agricultural guidance.")

else:
    st.subheader("How it works")
    a, b, c = st.columns(3)
    a.markdown("### 1. Enter details\nVillage, grain and storage conditions.")
    b.markdown("### 2. Check forecast\nHumidity, temperature and rainfall for the next 3 days.")
    c.markdown("### 3. Get advice\nA simple risk level, reasons and preventive steps.")
    st.markdown("Use the sidebar to enter details, then click **Check storage risk**. If the weather service is unavailable, keep demo mode enabled for your presentation.")
