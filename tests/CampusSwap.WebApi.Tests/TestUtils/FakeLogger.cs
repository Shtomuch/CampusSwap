using Microsoft.Extensions.Logging;

namespace CampusSwap.WebApi.Tests.TestUtils;

internal sealed class FakeLogger<T> : ILogger<T>
{
    
    IDisposable ILogger.BeginScope<TState>(TState state) => NullScope.Instance;

    bool ILogger.IsEnabled(LogLevel logLevel) => true;

    void ILogger.Log<TState>(
        LogLevel logLevel, EventId eventId, TState state, Exception? exception,
        Func<TState, Exception?, string> formatter)
    {
        
    }

    private sealed class NullScope : IDisposable
    {
        public static readonly NullScope Instance = new();
        public void Dispose() { }
    }
}