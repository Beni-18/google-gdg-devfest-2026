from app.pii import scrub


def test_scrubs_identifiers():
    text = "Aadhaar 1234 5678 9012, PAN ABCDE1234F, passport K1234567, call +91 98765 43210 or a@b.in"
    out = scrub(text)
    for secret in ("1234 5678 9012", "ABCDE1234F", "K1234567", "98765 43210", "a@b.in"):
        assert secret not in out
    assert "[AADHAAR]" in out and "[PAN]" in out and "[PASSPORT_NO]" in out and "[PHONE]" in out


def test_leaves_dates_and_years_alone():
    text = "Born 26/01/1989, applied in 2025, waited 42 days"
    assert scrub(text) == text
