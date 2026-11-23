# Little Play 2: STEAM learning games for children aged 3 to 5

Seventeen tap-and-drag games in five subjects, all in English, no ads, no accounts and no data collection. It runs in the browser on phones and tablets, and can be wrapped as an Android and iOS app with Capacitor (`app/`). It is the follow-up to Little Play (ages 1 to 3).

**Run it:** `python -m http.server 8080` in this folder, then open `http://localhost:8080`.

**Parent area:** hold the ⚙️ button on the home screen for 2 seconds, then type the number that is written in words. There: volume, voice on or off, the child's age (sets the starting level), the play timer, screen lock on Android, and "start the stars over".

## The games

| Subject | Game | What the child does | Idea behind it |
|---|---|---|---|
| 🔬 Science | Sink or Float | Guesses whether a thing sinks or floats, then watches | Predict, then test |
| | Magnet Lab | Drags a magnet over things to find which stick | Properties of materials |
| | What Comes Next? | Finishes a life cycle (plant, chick, butterfly, day, seasons) | Order and change over time |
| | Where Do I Live? | Matches an animal to its home | Habitats |
| 🤖 Technology | Robot Path | Puts arrows in order to guide a robot to a star | First steps in coding: sequences and debugging |
| | Pixel Painter | Copies a picture made of coloured squares | A screen is made of pixels |
| | Light It Up | Picks the thing that lets electricity reach the bulb | Conductors and insulators |
| 🔧 Engineering | Tower Builder | Stacks blocks; a wide block on a narrow one makes it fall | Stability and a wide base |
| | Gear Fit | Chooses the gear that fits the gap so all gears turn | Meshing gears turn the opposite way |
| | Ramp Race | Changes a ramp's height to roll a ball into a basket | Height gives speed; test and adjust |
| 🎨 Art | Colour Mixer | Pours two paints to make a target colour | Primary and secondary colours |
| | Mirror Paint | Paints on one side, the other side copies | Symmetry |
| | Pattern Parade | Says what comes next in a pattern (AB, AAB, ABC...) | Patterns, early algebra |
| 🔢 Math | Count & Give | Puts a number of things in a basket, or counts and answers | Counting with one-to-one matching |
| | Add It Up | Adds two groups of pictures | Addition within 10 |
| | Balance It | Adds blocks to make a scale balance | Equal means "the same amount" |
| | Small to Big | Taps things from the smallest to the biggest | Comparing and ordering sizes |

## Design rules

1. **No losing, no clock.** A wrong answer wiggles and the child tries again; after two misses the right choice pulses. The stars on each game only go up.
2. **Adaptive difficulty.** Every game has three levels. It starts from the child's age, goes up after two right answers in a row and down after two misses in a row.
3. **Predict, then check.** Where it fits (sink or float, ramp, colour mixing) the child makes a guess first.
4. **Everything is spoken and written.** Each instruction is shown in a banner and read aloud; the 🔊 button repeats it. Children who cannot read yet can still play.
5. **Only taps and drags,** with big buttons. Hints appear after two misses.
6. **Widely supported emoji only,** so older phones show every picture.

## Files

`core.js` (settings, sounds, voice, effects, levels), `games-science.js`, `games-tech.js`, `games-eng.js`, `games-art.js`, `games-math.js`, `shell.js` (home, parent area, timer, screen lock), `style.css`, `sw.js` (offline), `app/` (Capacitor wrapper and the Android and iOS patch scripts), `.github/workflows/` (builds), `IOS-SETUP.md` (steps for the Apple account, in Vietnamese). `_test.js` is a development helper that solves every game automatically in the browser.
