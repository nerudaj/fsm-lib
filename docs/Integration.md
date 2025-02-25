# Integration

This library is a C++23 library, so don't forget to always enable it for your target using `set ( CMAKE_CXX_STANDARD 23 )`.

## CMake Package Manager

Assuming that you've enabled CPM in your CMake code, you can bring this library in like this:

```cmake
CPMAddPackage("gh:nerudaj/fsm-cpp#2.0.0")

set ( CMAKE_CXX_STANDARD 23 )

target_link_libraries ( ${MYTARGET} fsm-cpp )
```

Full example is available [here](../integration_tests/cpm).

## Fetch Content with Git

CPM is just a wrapper over native `FetchContent` call. So you can invoke it directly:

```cmake
include ( FetchContent )

FetchContent_Declare ( LIBFSM_GIT
	GIT_REPOSITORY "https://github.com/nerudaj/fsm-lib"
	GIT_TAG "v2.0.0"
)

FetchContent_MakeAvailable ( LIBFSM_GIT )

target_link_libraries ( ${MYTARGET} fsm-lib )
```

Full example is available [here](../integration_tests/fetch_git).

## Fetch Content with Releases

Who wants to waste time building their dependencies? You can use `FetchContent` to fetch published releases. You can integrate them easily using `find_package` command.

```cmake
# First, download and unpack the release using FetchContent
include ( FetchContent )

FetchContent_Declare ( LIBFSM
	URL "https://github.com/nerudaj/fsm-lib/releases/download/v2.1.1/fsm-lib-v2.1.1-Windows-MSVC-x64.zip"
	DOWNLOAD_EXTRACT_TIMESTAMP TRUE
)

find_package ( fsm-lib 2.1.0 REQUIRED PATHS "${libfsm_SOURCE_DIR}/lib/cmake" )
```

Full example is available [here](../integration_tests/fetch_release).
