using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;

namespace ArchX.Server.Features.Email;

public class SmtpEmailSender(IOptions<SmtpOptions> options) : IEmailSender
{
    private readonly SmtpOptions options = options.Value;

    public async Task SendAsync(string toEmail, string subject, string htmlBody)
    {
        if (string.IsNullOrWhiteSpace(options.Host))
            throw new InvalidOperationException("SmtpOptions:Host не задан в конфигурации.");

        if (string.IsNullOrWhiteSpace(options.FromEmail))
            throw new InvalidOperationException("SmtpOptions:FromEmail не задан в конфигурации.");

        using var message = new MailMessage
        {
            From = new MailAddress(options.FromEmail, options.FromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
        };
        message.To.Add(toEmail);

        using var client = new SmtpClient(options.Host, options.Port)
        {
            EnableSsl = options.EnableSsl,
        };

        if (!string.IsNullOrWhiteSpace(options.UserName))
        {
            client.Credentials = new NetworkCredential(options.UserName, options.Password);
        }

        await client.SendMailAsync(message);
    }
}
