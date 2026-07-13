from calculator import add


def test_add_numbers():
    assert add(2, 3) == 5


def test_C17_numeric_string():
    assert add("2", 3) == 5
