import { Component } from "./base.js"
import { mergeDeep } from "./mergeDeep.js"

const log = (...args) => {
    if (typeof window !== 'undefined' && window.debug) console.log(`getFieldInfo:`, ...args)
}

export class FieldFactory extends Component {
    constructor({ container, setTrap }) {
        super({ setTrap })
        this.container = container
    }
    generateFields() {
        const { childProperties, parentProperties } = this.propertyDependencyTree

        const fields = {}

        const properties = this.container.schema.properties || this.container.schema.items.properties

        for (const propertyName in properties) {
            const fieldInfo = this.getFieldInfo(propertyName, parentProperties)
            let field = fieldInfo.fieldType.field.fieldClass.for(fieldInfo)

            field.dependencies = childProperties[propertyName]
            fields[propertyName] = field
        }
        return fields
    }
    get properties() {
        return (this.container.schema.items ? this.container.schema.items : this.container.schema).properties
    }
    checkRequired(propertyName) {
        const required = (this.container.schema.items ? this.container.schema.items : this.container.schema).required
        return required && Array.isArray(required) && required.includes(propertyName)
    }
    getFieldInfo(propertyName, parentProperties) {
        const required = this.checkRequired(propertyName),
            propertySchema = Object.assign({ required }, this.properties[propertyName]),
            fieldOptions = Object.assign({}, this.container.options.fields[propertyName])

        if (!fieldOptions) throw new Error(`Property [${propertyName}] does not have an entry in Options`)

        let type = fieldOptions.type || propertySchema.type
        if (!type) log(`There is no type defined for property [${propertyName}]`)

        const fieldEnum = propertySchema.enum || fieldOptions.enum
        if (!type && propertySchema.enum && fieldEnum.length) {
            if (fieldEnum.length <= 3) type = "radio"
            if (fieldEnum.length > 3) type = "select"
        }

        const customFieldType = this.container.customFieldTypes && this.container.customFieldTypes.find(c => c.name === type),
            fieldType = this.container.fieldTypes.fieldType(customFieldType ? "custom" : type)

        log(`Mapped property [${propertyName}] with type [${type}] to the [${this.container.fieldTypes.name}] field type [${fieldType.field.name}${fieldType.customFieldType ? ` (${fieldType.customFieldType.name})` : ""}]`)

        return {
            property: propertyName, schema: propertySchema, options: fieldOptions,
            type, fieldType, customFieldType, container: this.container,
            customFieldTypes: this.container.customFieldTypes,
            fieldTypes: this.container.fieldTypes,
            templateHelpers: this.container.templateHelpers,
            setTrap: (propertyName, value, field) => {
                if (propertyName !== "value" && propertyName !== "lastFieldChanged" && propertyName !== "customValue") return
                for (const childProperty of parentProperties[field.property] || []) {
                    field.container.fields && field.container.fields[childProperty].dependencyChange(field)
                }
            }
        }
    }
    get propertyDependencyTree() {
        //Walk through each of the dependencies and calculate the cascaded child to parent relationships
        const childProperties = {}
        for (const d in this.container.schema.dependencies) childProperties[d] = this.getPropertyDependencies(d)

        //Calculate the inverse relationship from Parent down to Child
        const parentProperties = {}
        for (const child in childProperties) {
            for (const parent of childProperties[child]) {
                if (!parentProperties[parent.propertyName]) parentProperties[parent.propertyName] = []
                parentProperties[parent.propertyName].push(child)
            }
        }

        return { childProperties, parentProperties }
    }

    getPropertyDependencies(propertyName, checkedRelationships = []) {
        const options = this.container.options.fields[propertyName].dependencies || {}
        let dependencies = (this.container.schema.dependencies[propertyName] || []).map(d =>
            ({ propertyName: d, condition: options[d] })
        )

        for (const d of dependencies) {
            if (checkedRelationships.includes(`${propertyName}-${d.propertyName}`))
                this.throwError(`The schema contains a recursive dependency starting from [${propertyName}] to [${d.propertyName}]`)

            checkedRelationships.push(`${propertyName}-${d.propertyName}`)
            dependencies = dependencies.concat(this.getPropertyDependencies(d.propertyName, checkedRelationships))
        }

        return dependencies
    }
}

