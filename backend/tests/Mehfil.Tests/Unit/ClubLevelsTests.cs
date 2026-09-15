using Mehfil.Core.Economy;

namespace Mehfil.Tests.Unit;

public sealed class ClubLevelsTests
{
    [Fact]
    public void JarsForNextLevel_GrowsThenCaps()
    {
        Assert.Equal(55, ClubLevels.JarsForNextLevel(1));
        Assert.Equal(150, ClubLevels.JarsForNextLevel(20));
        Assert.Equal(150, ClubLevels.JarsForNextLevel(60));
    }

    [Fact]
    public void Apply_FillsJar_CarriesRemainder()
    {
        var r = ClubLevels.Apply(level: 1, jarHearts: 400, jarsCollected: 0, jarsForNext: 55, jarTarget: 500, hearts: 650);

        Assert.Equal(1, r.Level);
        Assert.Equal(550 - 500, r.JarHearts);
        Assert.Equal(2, r.JarsCollected);
        Assert.False(r.LeveledUp);
    }

    [Fact]
    public void Apply_LevelsUp_WhenEnoughJars()
    {
        var r = ClubLevels.Apply(level: 1, jarHearts: 0, jarsCollected: 54, jarsForNext: 55, jarTarget: 500, hearts: 500);

        Assert.Equal(2, r.Level);
        Assert.Equal(0, r.JarsCollected);
        Assert.Equal(ClubLevels.JarsForNextLevel(2), r.JarsForNext);
        Assert.True(r.LeveledUp);
    }

    [Fact]
    public void Apply_CanLevelSeveralTimes_WithAHugeGift()
    {
        var r = ClubLevels.Apply(level: 1, jarHearts: 0, jarsCollected: 0, jarsForNext: 55, jarTarget: 500, hearts: 500 * 200);

        Assert.True(r.Level >= 3);
        Assert.True(r.LeveledUp);
        Assert.InRange(r.JarHearts, 0, 499);
    }
}
