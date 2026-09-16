import { SpeakingDetector } from '../speakingDetector';

describe('SpeakingDetector', () => {
  it('turns on at the threshold and off only after the hold time', () => {
    const d = new SpeakingDetector(25, 700);

    expect(d.update(10, 0)).toBeNull();
    expect(d.update(40, 300)).toBe(true);
    expect(d.update(60, 600)).toBeNull(); // still speaking, no change
    expect(d.update(5, 900)).toBeNull(); // quiet, but within hold
    expect(d.update(5, 1500)).toBeNull(); // 600 ms quiet < 700
    expect(d.update(5, 1700)).toBe(false); // 800 ms quiet
    expect(d.update(5, 2000)).toBeNull();
  });

  it('a burst of sound during the hold keeps it speaking', () => {
    const d = new SpeakingDetector(25, 700);
    d.update(50, 0);
    d.update(0, 100);
    expect(d.update(50, 600)).toBeNull(); // resets the quiet timer
    expect(d.update(0, 1200)).toBeNull(); // quiet timer starts here
    expect(d.update(0, 1700)).toBeNull(); // 500 ms quiet
    expect(d.update(0, 1950)).toBe(false); // 750 ms quiet
  });

  it('reset() reports the transition only when it was speaking', () => {
    const d = new SpeakingDetector();
    expect(d.reset()).toBeNull();
    d.update(100, 0);
    expect(d.reset()).toBe(false);
  });
});
