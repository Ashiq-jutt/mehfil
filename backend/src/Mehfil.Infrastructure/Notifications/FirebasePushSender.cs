using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using Mehfil.Core.Notifications;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Mehfil.Infrastructure.Notifications;

/// <summary>
/// FCM transport. Without credentials it stays unconfigured and notifications are only stored in the database,
/// so development machines work without a Firebase project.
/// </summary>
public sealed class FirebasePushSender : IPushSender
{
    public const string AndroidChannelId = "mehfil_default";

    private readonly FirebaseMessaging? _messaging;
    private readonly ILogger<FirebasePushSender> _logger;

    public FirebasePushSender(IOptions<FirebaseOptions> options, ILogger<FirebasePushSender> logger)
    {
        _logger = logger;
        var o = options.Value;
        GoogleCredential? credential = null;
        try
        {
            if (!string.IsNullOrWhiteSpace(o.CredentialsJson))
            {
                credential = GoogleCredential.FromJson(o.CredentialsJson);
            }
            else if (!string.IsNullOrWhiteSpace(o.CredentialsPath) && File.Exists(o.CredentialsPath))
            {
                credential = GoogleCredential.FromFile(o.CredentialsPath);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Firebase credentials could not be loaded; push notifications are disabled");
        }

        if (credential is null)
        {
            logger.LogInformation("Firebase not configured (Firebase:CredentialsPath / CredentialsJson); push notifications are stored only");
            return;
        }

        var app = FirebaseApp.DefaultInstance ?? FirebaseApp.Create(new AppOptions { Credential = credential });
        _messaging = FirebaseMessaging.GetMessaging(app);
    }

    public bool IsConfigured => _messaging is not null;

    public async Task<IReadOnlyList<string>> SendAsync(IReadOnlyList<string> tokens, string title, string body, IReadOnlyDictionary<string, string> data, CancellationToken ct)
    {
        if (_messaging is null || tokens.Count == 0)
        {
            return [];
        }

        var message = new MulticastMessage
        {
            Tokens = tokens.ToList(),
            Notification = new FirebaseAdmin.Messaging.Notification { Title = title, Body = body },
            Data = data.ToDictionary(kv => kv.Key, kv => kv.Value),
            Android = new AndroidConfig
            {
                Priority = Priority.High,
                Notification = new AndroidNotification { ChannelId = AndroidChannelId, Sound = "default" },
            },
            Apns = new ApnsConfig { Aps = new Aps { Sound = "default" } },
        };

        var response = await _messaging.SendEachForMulticastAsync(message, ct);
        var dead = new List<string>();
        for (var i = 0; i < response.Responses.Count; i++)
        {
            var r = response.Responses[i];
            if (r.IsSuccess)
            {
                continue;
            }

            var code = r.Exception?.MessagingErrorCode;
            if (code is MessagingErrorCode.Unregistered or MessagingErrorCode.InvalidArgument or MessagingErrorCode.SenderIdMismatch)
            {
                dead.Add(tokens[i]);
            }
            else
            {
                _logger.LogWarning(r.Exception, "FCM send failed ({Code})", code);
            }
        }

        return dead;
    }
}
