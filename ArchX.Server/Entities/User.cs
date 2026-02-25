using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace ArchX.Server.Entities;

public class User : IdentityUser<long>
{
    [Key]
    public override long Id { get; set; }
}
