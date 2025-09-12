#pragma once

#include <format>
#ifdef __cpp_lib_stacktrace
#include <stacktrace>
#endif
#include <stdexcept>
#include <string>

namespace fsm
{
    /**
     * Library error type used in exceptions.
     * It contains a message with a serialized stack trace.
     */
    class [[nodiscard]] Error : public std::runtime_error
    {
    public:
        Error(
            const std::string& message,
#ifdef __cpp_lib_stacktrace
            std::stacktrace trace = std::stacktrace::current())
#else
            std::string trace = "Trace is not available with your compiler")
#endif
            : std::runtime_error(
                  "Error message: " + message + "\n\nStacktrace: " +
#ifdef __cpp_lib_stacktrace
                  std::to_string(trace))
#else
                  trace)
#endif
        {
        }
    };
} // namespace fsm
