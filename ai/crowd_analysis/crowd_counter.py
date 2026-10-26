def analyze_crowd(total_faces):
    if total_faces == 0:
        level = "Empty"
        message = "No crowd detected"
    elif total_faces <= 5:
        level = "Safe"
        message = "Low crowd density"
    elif total_faces <= 15:
        level = "Moderate"
        message = "Moderate crowd density"
    elif total_faces <= 30:
        level = "High"
        message = "High crowd density"
    else:
        level = "Critical"
        message = "Very high crowd density"

    return {
        "total_faces": total_faces,
        "level": level,
        "message": message
    }