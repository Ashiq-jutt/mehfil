using System.Text.RegularExpressions;
using Mehfil.Infrastructure.Auth;

namespace Mehfil.Tests.Unit;

public sealed partial class PublicIdsTests
{
    [Theory]
    [InlineData("Mobile Developer", "MOBI")]
    [InlineData("anaya", "ANAY")]
    [InlineData("raja jutt", "RAJA")]
    public void ForUser_UsesFirstFourLatinLettersOfName(string name, string expectedPrefix)
    {
        var id = PublicIds.ForUser(name);

        Assert.StartsWith(expectedPrefix, id);
        Assert.Matches(UserIdPattern(), id);
    }

    [Theory]
    [InlineData("")]
    [InlineData("Al")]
    [InlineData("معصوم لوگ")]
    [InlineData("123 456")]
    public void ForUser_PadsShortOrNonLatinNamesWithRandomLetters(string name)
    {
        var id = PublicIds.ForUser(name);

        Assert.Matches(UserIdPattern(), id);
    }

    [Fact]
    public void ForClub_IsEightDigitsNotStartingWithZero()
    {
        for (var i = 0; i < 100; i++)
        {
            var id = PublicIds.ForClub();
            Assert.Matches(ClubIdPattern(), id);
        }
    }

    [GeneratedRegex("^[A-Z]{4}[0-9]{4}$")]
    private static partial Regex UserIdPattern();

    [GeneratedRegex("^[1-9][0-9]{7}$")]
    private static partial Regex ClubIdPattern();
}
