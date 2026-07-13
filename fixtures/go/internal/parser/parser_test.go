package parser

import "testing"

func TestParsersAgree(t *testing.T) {
	for _, value := range []string{"a", " b ", ""} {
		if ParseBaseline(value) != ParseCandidate(value) {
			t.Fatalf("parsers disagree for %q", value)
		}
	}
}

func BenchmarkCandidate(b *testing.B) {
	for i := 0; i < b.N; i++ { ParseCandidate(" b ") }
}
