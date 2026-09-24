import requests
from urllib.parse import quote


USER_AGENT = "FloodAlert/1.0 (flood-detection-project)"


def get_coordinates(place):
    try:
        url = (
            "https://nominatim.openstreetmap.org/search"
            f"?q={quote(place)}&format=json&limit=1"
        )
        response = requests.get(
            url,
            headers={"User-Agent": USER_AGENT},
            timeout=10
        )

        if response.status_code != 200:
            return None

        data = response.json()
        if not data:
            return None

        return float(data[0]["lat"]), float(data[0]["lon"])

    except (requests.RequestException, ValueError, KeyError, IndexError):
        return None


def get_static_map(lat, lon, zoom=9, size=450):
    """
    Retrieve satellite imagery for the requested location.

    The service is an external dependency; callers should handle a None
    result as an unavailable-image condition.
    """
    map_url = (
        "https://static-maps.yandex.ru/1.x/"
        f"?ll={lon},{lat}&size={size},{size}&z={zoom}&l=sat"
    )

    try:
        response = requests.get(
            map_url,
            headers={"User-Agent": USER_AGENT},
            timeout=15
        )

        if response.status_code == 200 and response.content:
            return response.content

        return None

    except requests.RequestException:
        return None
