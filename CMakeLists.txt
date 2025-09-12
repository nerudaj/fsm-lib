cmake_minimum_required ( VERSION 3.26 )

include ( "${CMAKE_CURRENT_SOURCE_DIR}/cmake/cpp-init.cmake" )

option ( BOOTSTRAP_CPM "Whether to download CPM" ON )
option ( BUILD_TESTS "Build unit testing target" ON )
option ( BUILD_EXAMPLES "Build example targets" ON )

if ( ${BOOTSTRAP_CPM} )
	bootstrap_cpm ()
endif ()

set ( CMAKE_CXX_STANDARD		   23 )
set ( CMAKE_CXX_STANDARD_REQUIRED  ON )

get_version_from_git (
	PROJECT_VERSION_VARIABLE GIT_PROJECT_VERSION
	FULL_VERSION_VARIABLE FULL_PROJECT_VERSION
)

project ( fsm-lib VERSION "${GIT_PROJECT_VERSION}" LANGUAGES CXX )

if (NOT ${PROJECT_IS_TOP_LEVEL} )
	message ( "INFO: fsm-lib is used as a dependency, turning off unwanted features" )
	set ( BUILD_TESTS OFF )
	set ( BUILD_EXAMPLES OFF )
endif ()

add_subdirectory ( "${PROJECT_SOURCE_DIR}/lib" )
add_library ( fsm::fsm-lib ALIAS fsm-lib )

if ( ${BUILD_TESTS} )
	enable_testing()
	add_subdirectory ( "${PROJECT_SOURCE_DIR}/tests" )
endif ()

if ( ${BUILD_EXAMPLES} )
	add_subdirectory ( "${PROJECT_SOURCE_DIR}/examples" )
endif ()

# Packaging rules
install (
	FILES       "${PROJECT_SOURCE_DIR}/changelog.txt"
	DESTINATION "."
)

install (
	FILES       "${PROJECT_SOURCE_DIR}/LICENSE"
	DESTINATION "."
)

install (
	FILES       "${PROJECT_SOURCE_DIR}/Readme.md"
	DESTINATION "."
)

# Packaging
if ( ${PROJECT_IS_TOP_LEVEL} )
    if ( "${CMAKE_CXX_COMPILER_ID}" STREQUAL "MSVC" )
        set ( COMPILER_ID "${CMAKE_CXX_COMPILER_ID}-${MSVC_TOOLSET_VERSION}" )
    else ()
        set ( COMPILER_ID "${CMAKE_CXX_COMPILER_ID}-${CMAKE_CXX_COMPILER_VERSION}" )
    endif ()

    message ( "Packaging with compiler ID: ${COMPILER_ID}" )

	set ( CPACK_GENERATOR "ZIP" )
	set ( CPACK_PACKAGE_FILE_NAME "${PROJECT_NAME}-${FULL_PROJECT_VERSION}-${CMAKE_SYSTEM_NAME}-${CMAKE_GENERATOR_PLATFORM}-${COMPILER_ID}" )

	include ( CPack )
endif()
