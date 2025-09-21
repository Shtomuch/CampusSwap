using CampusSwap.Application.Common.Interfaces;
using CampusSwap.Infrastructure.Data;
using CampusSwap.Infrastructure.Identity;
using CampusSwap.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace CampusSwap.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Database
        var databaseProvider = configuration["Database:Provider"] ?? "PostgreSQL";
        var connectionString = configuration.GetConnectionString(databaseProvider)
            ?? configuration.GetConnectionString("DefaultConnection");

        switch (databaseProvider.ToLower())
        {
            case "sqlite":
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseSqlite(connectionString));
                break;
            case "postgresql":
            default:
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseNpgsql(connectionString));
                break;
        }

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

        // Services
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IFileStorageService, FileStorageService>();

        // Authentication
        var jwtSecret = configuration["JwtSettings:Secret"] ?? "ThisIsASuperSecretKeyForDevelopmentOnly123456789";
        var key = Encoding.ASCII.GetBytes(jwtSecret);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = configuration["JwtSettings:Issuer"] ?? "CampusSwap",
                ValidateAudience = true,
                ValidAudience = configuration["JwtSettings:Audience"] ?? "CampusSwapUsers",
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"];
                    var path = context.HttpContext.Request.Path;
                    
                    if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    {
                        context.Token = accessToken;
                    }
                    
                    return Task.CompletedTask;
                }
            };
        });

        return services;
    }
}