/**
 * This class is a huge violation of RAII and I am accutely aware of that.
 *
 * However, the initial design of this project was that fsm::Fsm has opt-in
 * logging, with the logger being rebindable at any moment. So it needs some
 * default NullObject, and then the ability to unbind from it.
 *
 * And now I need fsm::Fsm movable so it can be returned inside of std::expected
 * from the fsm::Factory, so I am implementing this wrapper that should hide
 * the complexity.
 */

#pragma once

/**
 * A wrapper over some polymorphic object. Initially, it points to
 * default-constructible NullObject implementing the Interface (aka DefaultImpl
 * type) and can be at any time set to some other implementation of the
 * Interface.
 *
 * The class owns the NullObject and properly implements moving of the resource,
 * while switching to non-owning mode for the other implementations of
 * Interface.
 */
template<class Interface, class DefaultImpl>
class [[nodiscard]] SemiOwningWrapper final
{
public:
    SemiOwningWrapper() : interface(&defaultImpl) {}

    SemiOwningWrapper(SemiOwningWrapper&& other)
    {
        if (&other.defaultImpl == other.interface)
            interface = &defaultImpl;
        else
            interface = other.interface;
    }

    // Copy constructor not needed so far
    SemiOwningWrapper(const SemiOwningWrapper&) = delete;

    SemiOwningWrapper& operator=(SemiOwningWrapper&& other)
    {
        if (this != &other)
        {
            if (&other.defaultImpl == other.interface)
                interface = &defaultImpl;
            else
                interface = other.interface;
        }
        return *this;
    }

public:
    Interface& get()
    {
        return *interface;
    }

    const Interface& get() const
    {
        return *interface;
    }

    void set(Interface& newInterface)
    {
        interface = &newInterface;
    }

    void reset()
    {
        interface = &defaultImpl;
    }

public:
    DefaultImpl defaultImpl;
    Interface* interface = nullptr;
};
