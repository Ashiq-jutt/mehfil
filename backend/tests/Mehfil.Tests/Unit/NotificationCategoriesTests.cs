using Mehfil.Core.Enums;
using Mehfil.Core.Notifications;

namespace Mehfil.Tests.Unit;

public sealed class NotificationCategoriesTests
{
    [Fact]
    public void EachType_IsGatedByItsOwnSetting()
    {
        var giftsOff = new NotificationSettingsDto(PushGifts: false, PushFollows: true, PushRewards: true, PushSystem: true);
        Assert.False(NotificationCategories.Allows(NotificationType.GiftReceived, giftsOff));
        Assert.True(NotificationCategories.Allows(NotificationType.ClubFollowed, giftsOff));

        var followsOff = new NotificationSettingsDto(true, false, true, true);
        Assert.False(NotificationCategories.Allows(NotificationType.ClubFollowed, followsOff));

        var rewardsOff = new NotificationSettingsDto(true, true, false, true);
        Assert.False(NotificationCategories.Allows(NotificationType.LeaderboardReward, rewardsOff));
        Assert.True(NotificationCategories.Allows(NotificationType.AdminGranted, rewardsOff));
    }

    [Fact]
    public void SystemSetting_CoversEverythingElse()
    {
        var systemOff = new NotificationSettingsDto(true, true, true, false);
        Assert.False(NotificationCategories.Allows(NotificationType.System, systemOff));
        Assert.False(NotificationCategories.Allows(NotificationType.AdminGranted, systemOff));
        Assert.False(NotificationCategories.Allows(NotificationType.Kicked, systemOff));
        Assert.True(NotificationCategories.Allows(NotificationType.GiftReceived, systemOff));
    }
}
