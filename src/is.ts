
export default function is(instance, type) {
    //  if the type has an is function we call it
    if (typeof type?.is === "function") {
        return type.is(instance) === true
    }
    if (typeof type === "function") {
        return instance instanceof type
    }
    return instance === type
}