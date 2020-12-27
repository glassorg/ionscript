
type DataClass = { baseClasses: Set<DataClass>, implements: Set<DataClass> }

export default function createTypeCheck(cls: DataClass) {
    cls.implements = new Set<DataClass>()
    for (let baseClass of cls.baseClasses) {
        cls.implements.add(baseClass)
        for (let i of baseClass.implements) {
            cls.implements.add(i)
        }
    }
    return (instance) => {
        if (instance == null) {
            return false
        }
        let ctor = instance.constructor
        return ctor === cls || ctor.implements?.has(cls) === true
    }
}