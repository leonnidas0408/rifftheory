export const INSTRUMENTS = {
    guitar: {
        id: "guitar",
        type: "strings",
        label: "Guitarra / violão",
        shortLabel: "Guitarra",
        description: "6 cordas · E A D G B E",
        strings: [
            { number: 1, name: "E", midi: 64, thickness: 0.95 },
            { number: 2, name: "B", midi: 59, thickness: 1.1 },
            { number: 3, name: "G", midi: 55, thickness: 1.3 },
            { number: 4, name: "D", midi: 50, thickness: 1.55 },
            { number: 5, name: "A", midi: 45, thickness: 1.8 },
            { number: 6, name: "E", midi: 40, thickness: 2.05 },
        ],
        maxFret: 24,
        chordShapes: true,
    },
    bass: {
        id: "bass",
        type: "strings",
        label: "Baixo",
        shortLabel: "Baixo",
        description: "4 cordas · E A D G",
        strings: [
            { number: 1, name: "G", midi: 43, thickness: 1.5 },
            { number: 2, name: "D", midi: 38, thickness: 1.8 },
            { number: 3, name: "A", midi: 33, thickness: 2.1 },
            { number: 4, name: "E", midi: 28, thickness: 2.4 },
        ],
        maxFret: 24,
        chordShapes: false,
    },
    ukulele: {
        id: "ukulele",
        type: "strings",
        label: "Ukulele",
        shortLabel: "Ukulele",
        description: "4 cordas · G C E A",
        strings: [
            { number: 1, name: "A", midi: 69, thickness: 1.05 },
            { number: 2, name: "E", midi: 64, thickness: 1.2 },
            { number: 3, name: "C", midi: 60, thickness: 1.4 },
            { number: 4, name: "G", midi: 67, thickness: 1.1 },
        ],
        maxFret: 15,
        chordShapes: false,
    },
    piano: {
        id: "piano",
        type: "keys",
        label: "Piano",
        shortLabel: "Piano",
        description: "Teclas · C3–C6",
        startMidi: 48,
        keyCount: 37,
        chordShapes: false,
    },
    keyboard: {
        id: "keyboard",
        type: "keys",
        label: "Teclado",
        shortLabel: "Teclado",
        description: "Teclas · C3–C6",
        startMidi: 48,
        keyCount: 37,
        chordShapes: false,
    },
};

export const DEFAULT_INSTRUMENT_ID = "guitar";

export function getInstrument(id = DEFAULT_INSTRUMENT_ID) {
    return INSTRUMENTS[id] || INSTRUMENTS[DEFAULT_INSTRUMENT_ID];
}

export function createInstrumentState(instrumentId = DEFAULT_INSTRUMENT_ID) {
    const instrument = getInstrument(instrumentId);
    if (!instrument.strings) return {};
    return Object.fromEntries(
        instrument.strings.map(({ number }) => [number, { muted: true, fret: 0 }])
    );
}
