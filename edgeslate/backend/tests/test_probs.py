from app.services.probs import american_to_implied, blend_probs, elo_win_prob, remove_vig_two_way


def test_american_favorite():
    assert abs(american_to_implied(-150) - 0.6) < 1e-9


def test_american_dog():
    assert abs(american_to_implied(150) - (100 / 250)) < 1e-9


def test_remove_vig():
    a, b = remove_vig_two_way(0.55, 0.55)
    assert abs(a + b - 1.0) < 1e-9
    assert abs(a - 0.5) < 1e-9


def test_elo_home_favorite():
    p = elo_win_prob(1700, 1500, home_advantage=60)
    assert p > 0.7


def test_blend():
    assert abs(blend_probs(0.6, 0.4, 0.7, 0.3) - 0.54) < 1e-9
