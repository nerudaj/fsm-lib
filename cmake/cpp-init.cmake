# Function: download_file_if_not_there
# Description: If there is no file at ${TARGET} path, attempts to download it from the internet
# or creates an empty one if it fails
# Arguments:
#   URL - Url to download
#   TARGET - Path to downloaded file
function ( download_file_if_not_there URL TARGET )
    if (NOT EXISTS ${TARGET})
        file (TOUCH ${TARGET})
        file (DOWNLOAD
            ${URL}
            ${TARGET}
        )
    endif()
endfunction()

# Function: bootstrap_cpm
# Description: Bootstraps the CPM package manager by downloading and including the specified version of the CPM.cmake script.
# Arguments:
#   VERSION - The version of CPM to download. Defaults to "latest".
# Example:
#   bootstrap_cpm()
#   bootstrap_cpm(VERSION "v0.34.0")
function ( bootstrap_cpm )
    set ( oneValueArgs VERSION )

    cmake_parse_arguments( BOOTSTRAP_CPM "" "${oneValueArgs}" "" ${ARGN} )

    set ( VERSION "latest" )
    if ( BOOTSTRAP_CPM_VERSION )
        set ( VERSION "${BOOTSTRAP_CPM_VERSION}" )
    endif()

    file ( DOWNLOAD 
        "https://github.com/cpm-cmake/CPM.cmake/releases/${VERSION}/download/get_cpm.cmake"
        "${CMAKE_CURRENT_BINARY_DIR}/get_cpm.cmake"
    )

    include ( "${CMAKE_CURRENT_BINARY_DIR}/get_cpm.cmake" )
endfunction ()

# Macro: set_cpp23_x64
# Description: Sets the CMake generator platform to x64 and configures the C++ standard to C++23, ensuring that it is required.
# Arguments: None
macro ( set_cpp23_x64 )
    set ( CMAKE_GENERATOR_PLATFORM     x64 )
    set ( CMAKE_CXX_STANDARD		   23 )
    set ( CMAKE_CXX_STANDARD_REQUIRED  ON )
endmacro () 

# Macro: cpp-init
# Description: Initializes the project by calling the bootstrap_cpm function to set up CPM.cmake and the set_cpp23_x64 macro to configure the C++ standard and platform.
# Arguments: None
macro( cpp_init )
    bootstrap_cpm()
    set_cpp23_x64()
endmacro ()

# Function: glob_headers_and_sources
# Description: Recursively globs header and source files, organizes them into source groups, and sets the output variables with the discovered files.
# Arguments:
#   HEADERS_OUTVARNAME - Variable to store the list of discovered header files.
#   SOURCES_OUTVARNAME - Variable to store the list of discovered source files.
# Example:
#   glob_headers_and_sources(my_headers my_sources)
function ( glob_headers_and_sources HEADERS_OUTVARNAME SOURCES_OUTVARNAME )
    file ( GLOB_RECURSE
        LOCAL_HEADERS
        "${CMAKE_CURRENT_SOURCE_DIR}/include**/*.hpp"
    )
	
	file ( GLOB_RECURSE
		LOCAL_HEADERS2
        "${CMAKE_CURRENT_SOURCE_DIR}/include**/*.h"
	)
    
    file ( GLOB_RECURSE
        PRIVATE_HEADERS
        "${CMAKE_CURRENT_SOURCE_DIR}/private_include**/*.hpp"
    )
    
    file ( GLOB_RECURSE
        PRIVATE_HEADERS2
        "${CMAKE_CURRENT_SOURCE_DIR}/private_include**/*.h"
    )

    file ( GLOB_RECURSE
        LOCAL_SOURCES
        "${CMAKE_CURRENT_SOURCE_DIR}/src**/*.cpp"
    )
    
    file ( GLOB_RECURSE
        LOCAL_SOURCES2
        "${CMAKE_CURRENT_SOURCE_DIR}/source**/*.cpp"
    )

    source_group(
        TREE "${CMAKE_CURRENT_SOURCE_DIR}"
        FILES ${LOCAL_HEADERS} ${LOCAL_HEADERS2}
    )
    
    source_group(
        TREE "${CMAKE_CURRENT_SOURCE_DIR}"
        FILES ${PRIVATE_HEADERS} ${PRIVATE_HEADERS2}
    )

    source_group(
        TREE "${CMAKE_CURRENT_SOURCE_DIR}"
        FILES ${LOCAL_SOURCES} ${LOCAL_SOURCES2}
    )

    set ( ${HEADERS_OUTVARNAME} "${LOCAL_HEADERS};${LOCAL_HEADERS2};${PRIVATE_HEADERS};${PRIVATE_HEADERS2}" PARENT_SCOPE )
    set ( ${SOURCES_OUTVARNAME} "${LOCAL_SOURCES};${LOCAL_SOURCES2}" PARENT_SCOPE )
endfunction ()

# Function: get_version_from_git
# Description: Retrieves the current git version using `git describe --tags` and sets the specified project version variables.
# Arguments:
#   PROJECT_VERSION_VARIABLE - Variable to store the inferred project version.
#   FULL_VERSION_VARIABLE    - Variable to store the full git version.
# Additional Information:
#   The version string is retrieved using the `git describe --tags` command, which extracts the latest annotated tag from the git history.
#   The tags should follow the Semantic Versioning (semver) format, with an optional 'v' prefix. For example, 'v1.0.0' or '1.0.0'.
# Example:
#   get_version_from_git(PROJECT_VERSION_VARIABLE my_project_version FULL_VERSION_VARIABLE my_full_version)
function ( get_version_from_git )
    set ( oneValueArgs PROJECT_VERSION_VARIABLE FULL_VERSION_VARIABLE )

    cmake_parse_arguments( GET_VERSION_FROM_GIT "" "${oneValueArgs}" "" ${ARGN} )

    find_package( Git REQUIRED )

    execute_process (
        COMMAND ${GIT_EXECUTABLE} describe --tags
        WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
        OUTPUT_VARIABLE LOCAL_STDOUT
        OUTPUT_STRIP_TRAILING_WHITESPACE
    )

    string ( REGEX MATCH "[0-9]+\.[0-9]+\.[0-9]+" LOCAL_CORE_VERSION "${LOCAL_STDOUT}" )

    message ( "Found full git version: ${LOCAL_STDOUT}" )
    message ( "Inferred project version: ${LOCAL_CORE_VERSION}" )

    if ( GET_VERSION_FROM_GIT_PROJECT_VERSION_VARIABLE )
        set ( ${GET_VERSION_FROM_GIT_PROJECT_VERSION_VARIABLE} "${LOCAL_CORE_VERSION}" PARENT_SCOPE )
    endif ()

    if ( GET_VERSION_FROM_GIT_FULL_VERSION_VARIABLE )
        set ( ${GET_VERSION_FROM_GIT_FULL_VERSION_VARIABLE} "${LOCAL_STDOUT}" PARENT_SCOPE )
    endif ()
endfunction ()

include ( FetchContent )

function ( __fetch_common DEPNAME )
    FetchContent_MakeAvailable ( ${DEPNAME} )

    string ( TOLOWER ${DEPNAME} DEPNAME_LOWER )
    set ( "${DEPNAME}_FOLDER" "${${DEPNAME_LOWER}_SOURCE_DIR}" )
    
    return ( PROPAGATE "${DEPNAME}_FOLDER" )
endfunction ()

# Function: fetch_prebuilt_dependency
# Description: Fetches a prebuilt dependency from a specified URL.
# Arguments:
#   DEPNAME    - Name of the dependency.
# Options:
#   URL        - The URL from which to fetch the dependency. This parameter is mandatory.
#   CACHE_DIR  - The directory where the dependency will be cached. Defaults to "${PROJECT_BINARY_DIR}/_deps" if not specified.
# Example:
#   fetch_prebuilt_dependency(MyDependency URL "http://example.com/mydependency.zip")
#   fetch_prebuilt_dependency(MyDependency URL "http://example.com/mydependency.zip" CACHE_DIR "/path/to/cache")
function ( fetch_prebuilt_dependency DEPNAME )
    set ( oneValueArgs URL CACHE_DIR )
    
    cmake_parse_arguments( FHD "" "${oneValueArgs}" "" ${ARGN} )

    if ( NOT FHD_URL )
        message ( FATAL_ERROR "URL must be specified!" )
    endif ()
    
    set ( CACHE_DIR "${PROJECT_BINARY_DIR}/_deps" )
    if ( FHD_CACHE_DIR )
        set ( CACHE_DIR "${FHD_CACHE_DIR}" )
        message ( "Setting cache dir to: ${CACHE_DIR}" )
    endif()

    FetchContent_Declare ( ${DEPNAME}
        URL "${FHD_URL}"
        DOWNLOAD_EXTRACT_TIMESTAMP TRUE
        PREFIX "${CACHE_DIR}"
        SOURCE_SUBDIR "does-not-exist"
    )

    __fetch_common ( ${DEPNAME} )
    return ( PROPAGATE "${DEPNAME}_FOLDER" )
endfunction ()

# Function: fetch_headeronly_dependency
# Description: This function fetches a header-only dependency from a specified URL.
# Parameters:
#   DEPNAME    - Name of the dependency.
# Options:
#   URL        - The URL from which to fetch the dependency. This parameter is mandatory.
#   CACHE_DIR  - The directory where the dependency will be cached. If not specified, defaults to "${PROJECT_BINARY_DIR}/_deps".
# Example:
#   fetch_headeronly_dependency(MyDependency URL "http://example.com/mydependency.zip")
function ( fetch_headeronly_dependency DEPNAME )
    set ( oneValueArgs URL CACHE_DIR )
    
    cmake_parse_arguments( FHD "" "${oneValueArgs}" "" ${ARGN} )

    if ( NOT FHD_URL )
        message ( FATAL_ERROR "URL must be specified!" )
    endif ()
    
    set ( CACHE_DIR "${PROJECT_BINARY_DIR}/_deps" )
    if ( FHD_CACHE_DIR )
        set ( CACHE_DIR "${FHD_CACHE_DIR}" )
        message ( "Setting cache dir to: ${CACHE_DIR}" )
    endif()

    FetchContent_Declare ( ${DEPNAME}
        URL "${FHD_URL}"
        DOWNLOAD_NO_PROGRESS TRUE
        DOWNLOAD_NO_EXTRACT TRUE
        PREFIX "${CACHE_DIR}"
    )

    __fetch_common ( ${DEPNAME} )
    return ( PROPAGATE "${DEPNAME}_FOLDER" )
endfunction ()

function ( apply_compile_options TARGET )
	if ( ${MSVC} )
		target_compile_options ( ${TARGET}
			PRIVATE
			/W4
			/MP
			/we4265 # Missing virtual dtor
			/we4834 # Discarding result of [[nodiscard]] function
			/we4456 # Name shadowing
			/we4457 # Name shadowing
			/we4458 # Name shadowing
			/we4459 # Name shadowing
			# /wd4251
			/we4369 # value of enum overflows underlying type
			/we5205 # Dtor on iface is not virtual
		)
		
		set_target_properties(
			${TARGET} PROPERTIES
			DEBUG_POSTFIX "-d"
		)
		
		
	else ()
		message ( "apply_compile_options: no options for non-msvc compiler" )
	endif ()
endfunction ()

function ( enable_autoformatter TARGET )
	file ( COPY_FILE
		"${CLANG_FORMAT_PATH}"
		"${CMAKE_CURRENT_SOURCE_DIR}/.clang-format"
	)

	target_sources ( ${TARGET} PRIVATE 
		"${CMAKE_CURRENT_SOURCE_DIR}/.clang-format"
	)
endfunction ()

# NOTE: C++23 doesn't go well with .clang-tidy v17 currently installed in MSVC
function ( enable_linter TARGET )
	file ( COPY_FILE
		"${CLANG_TIDY_PATH}"
		"${CMAKE_CURRENT_SOURCE_DIR}/.clang-tidy"
	)

	target_sources ( ${TARGET} PRIVATE 
		"${CMAKE_CURRENT_SOURCE_DIR}/.clang-tidy"
	)

	if ( ${MSVC} )
		set_target_properties ( ${TARGET} PROPERTIES
			VS_GLOBAL_RunCodeAnalysis true
			VS_GLOBAL_EnableMicrosoftCodeAnalysis false
			VS_GLOBAL_EnableClangTidyCodeAnalysis true
		)
	else ()
		message ( "apply_compile_options: no options for non-msvc compiler" )
	endif ()
endfunction ()

macro ( link_public_header_folder TARGET )
    if ( EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/include")
        target_include_directories( ${TARGET} PUBLIC
            $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>  
            $<INSTALL_INTERFACE:include>
        )
    endif ()
endmacro ()

macro ( link_private_header_folder TARGET )
    if ( EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/private_include")
        target_include_directories( ${TARGET} PRIVATE "${CMAKE_CURRENT_SOURCE_DIR}/private_include" )
    endif ()
endmacro ()

macro ( make_static_library TARGET )
    set( options )
    set( multiValueArgs DEPS )

    cmake_parse_arguments ( CIMSL "${options}" "" "${multiValueArgs}" ${ARGN} )

    glob_headers_and_sources ( HEADERS SOURCES )

    add_library( ${TARGET} STATIC ${HEADERS} ${SOURCES} )

    link_public_header_folder ( ${TARGET} )
    link_private_header_folder ( ${TARGET} )

    if ( CIMSL_DEPS )
        target_link_libraries ( ${TARGET} PUBLIC ${CIMSL_DEPS} )
    endif ()

    enable_autoformatter ( ${TARGET} )
    apply_compile_options ( ${TARGET} )
endmacro()

macro ( make_executable TARGET )
    set( options )
    set( multiValueArgs DEPS )

    cmake_parse_arguments ( CIME "${options}" "" "${multiValueArgs}" ${ARGN} )

    glob_headers_and_sources ( HEADERS SOURCES )

    add_executable( ${TARGET} ${HEADERS} ${SOURCES} )

    link_public_header_folder ( ${TARGET} )
    link_private_header_folder ( ${TARGET} )

    if ( CIME_DEPS )
        target_link_libraries ( ${TARGET} PUBLIC ${CIME_DEPS} )
    endif ()

    enable_autoformatter ( ${TARGET} )
    apply_compile_options ( ${TARGET} )
endmacro()

### === BOOTSTRAPPING === ###
set ( CPP_INIT_REF "heads/main" )
# set ( CPP_INIT_REF "tags/v0.5.0" )

set ( CLANG_FORMAT_PATH "${CMAKE_BINARY_DIR}/.clang-format" )
download_file_if_not_there (
    "https://raw.githubusercontent.com/nerudaj/cpp-init/refs/${CPP_INIT_REF}/.clang-format"
    "${CLANG_FORMAT_PATH}"
)

set ( CLANG_TIDY_PATH "${CMAKE_BINARY_DIR}/.clang-tidy" )
download_file_if_not_there (
    "https://raw.githubusercontent.com/nerudaj/cpp-init/refs/${CPP_INIT_REF}/.clang-tidy"
    "${CLANG_TIDY_PATH}"
)