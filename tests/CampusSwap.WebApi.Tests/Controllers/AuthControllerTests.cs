using CampusSwap.WebApi.Controllers;
using CampusSwap.WebApi.Tests.TestUtils;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using CampusSwap.Application.Features.Auth.Commands;

namespace CampusSwap.WebApi.Tests.Controllers;

public class AuthControllerTests
{
    [Fact]
    public async Task Register_Returns_Ok_And_Sends_Command()
    {
        var mediator = new Mock<IMediator>();
        var sut = new AuthController(mediator.Object, new FakeLogger<AuthController>());

        var result = await sut.Register(new RegisterCommand { Email = "a@b.com", Password = "P@ssw0rd!" });

        var ok = Assert.IsType<OkObjectResult>(result);
        ok.StatusCode.Should().Be(200);

        mediator.Verify(m => m.Send(It.Is<RegisterCommand>(c => c.Email == "a@b.com"),
                                    It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Login_Returns_Ok_And_Sends_Command()
    {
        var mediator = new Mock<IMediator>();
        var sut = new AuthController(mediator.Object, new FakeLogger<AuthController>());

        var res = await sut.Login(new LoginCommand { Email = "a@b.com", Password = "x" });

        Assert.IsType<OkObjectResult>(res);
        mediator.Verify(m => m.Send(It.IsAny<LoginCommand>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RefreshToken_Returns_Ok_And_Sends_Command()
    {
        var mediator = new Mock<IMediator>();
        var sut = new AuthController(mediator.Object, new FakeLogger<AuthController>());

        var res = await sut.RefreshToken(new RefreshTokenCommand { RefreshToken = "r" });

        Assert.IsType<OkObjectResult>(res);
        mediator.Verify(m => m.Send(It.IsAny<RefreshTokenCommand>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Logout_Returns_Ok()
    {
        var sut = new AuthController(new Mock<IMediator>().Object, new FakeLogger<AuthController>());

        var res = await sut.Logout();

        var ok = Assert.IsType<OkObjectResult>(res);
        ok.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task VerifyEmail_Returns_Ok_And_Sends_Command()
    {
        var mediator = new Mock<IMediator>();
        var sut = new AuthController(mediator.Object, new FakeLogger<AuthController>());

        var res = await sut.VerifyEmail(new VerifyEmailCommand { Token = "t" });

        Assert.IsType<OkObjectResult>(res);
        mediator.Verify(m => m.Send(It.IsAny<VerifyEmailCommand>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ForgotPassword_Returns_Ok_And_Sends_Command()
    {
        var mediator = new Mock<IMediator>();
        var sut = new AuthController(mediator.Object, new FakeLogger<AuthController>());

        var res = await sut.ForgotPassword(new ForgotPasswordCommand { Email = "a@b.com" });

        Assert.IsType<OkObjectResult>(res);
        mediator.Verify(m => m.Send(It.IsAny<ForgotPasswordCommand>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ResetPassword_Returns_Ok_And_Sends_Command()
    {
        var mediator = new Mock<IMediator>();
        var sut = new AuthController(mediator.Object, new FakeLogger<AuthController>());

        var res = await sut.ResetPassword(new ResetPasswordCommand { Token = "t", NewPassword = "N3w!" });

        Assert.IsType<OkObjectResult>(res);
        mediator.Verify(m => m.Send(It.IsAny<ResetPasswordCommand>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}