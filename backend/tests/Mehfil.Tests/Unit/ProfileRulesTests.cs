using System.Text;
using Mehfil.Core.Common;
using Mehfil.Core.Enums;
using Mehfil.Core.Royalty;

namespace Mehfil.Tests.Unit;

public sealed class RoyaltyLevelsTests
{
    [Theory]
    [InlineData(0, RoyalLevel.None, PrimeLevel.None)]
    [InlineData(999, RoyalLevel.None, PrimeLevel.None)]
    [InlineData(1_000, RoyalLevel.R1, PrimeLevel.None)]
    [InlineData(14_999, RoyalLevel.R2, PrimeLevel.None)]
    [InlineData(250_000, RoyalLevel.R6, PrimeLevel.None)]
    [InlineData(500_000, RoyalLevel.R6, PrimeLevel.P1)]
    [InlineData(2_500_000, RoyalLevel.R6, PrimeLevel.P3)]
    public void Compute_MapsPointsToTiers(long points, RoyalLevel royal, PrimeLevel prime)
    {
        Assert.Equal((royal, prime), RoyaltyLevels.Compute(points));
    }

    [Fact]
    public void Next_ReturnsUpcomingTierOrNullAtTop()
    {
        Assert.Equal(("R1", 1_000L), RoyaltyLevels.Next(0));
        Assert.Equal(("R3", 15_000L), RoyaltyLevels.Next(5_000));
        Assert.Equal(("P1", 500_000L), RoyaltyLevels.Next(250_000));
        Assert.Null(RoyaltyLevels.Next(2_500_000));
    }
}

public sealed class BirthdayTests
{
    [Theory]
    [InlineData(1, 1, true)]
    [InlineData(31, 12, true)]
    [InlineData(29, 2, true)]
    [InlineData(30, 2, false)]
    [InlineData(31, 4, false)]
    [InlineData(0, 5, false)]
    [InlineData(10, 13, false)]
    public void IsValid_ChecksDayAgainstMonth(int day, int month, bool expected)
    {
        Assert.Equal(expected, Birthday.IsValid(day, month));
    }
}

public sealed class ImageSnifferTests
{
    [Fact]
    public void DetectsJpegPngWebp()
    {
        Assert.Equal("jpg", ImageSniffer.DetectExtension([0xFF, 0xD8, 0xFF, 0xE0, 0, 0, 0, 0, 0, 0, 0, 0]));
        Assert.Equal("png", ImageSniffer.DetectExtension([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0]));
        Assert.Equal("webp", ImageSniffer.DetectExtension(Encoding.ASCII.GetBytes("RIFF\0\0\0\0WEBPVP8 ")));
    }

    [Fact]
    public void RejectsOtherContent()
    {
        Assert.Null(ImageSniffer.DetectExtension(Encoding.ASCII.GetBytes("<svg xmlns=\"x\">")));
        Assert.Null(ImageSniffer.DetectExtension(Encoding.ASCII.GetBytes("GIF89a......")));
        Assert.Null(ImageSniffer.DetectExtension([]));
    }
}
