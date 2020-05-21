import { Component } from "./base.js"
import { dynamicTemplateWire } from "./dynamicTemplate.js"

const compiledFields = {}
export class FieldTypes extends Component {
	constructor({ mappings, fields, name, setTrap }) {
		super({ setTrap })
        this.mappings = mappings
        this.fields = fields
        this.name = name
        if (!compiledFields[this.name]) compiledFields[this.name] = {}
    }
    fieldType(nameOrType) {
        //Check if we are mapping from a type.
        const map = this.mappings[nameOrType]

        //Find a field
        let field = this.fields.find(f => (map && f.name === map.field) || (!map && f.name === nameOrType))

        //Use a default field if one wasn't found.
        if (!field) {
            if (nameOrType) this.log(`A [${nameOrType}] field was not found for [${this.name}]`)
            field = this.fields.find(f => f.name === "input")
        }

        //Cache the template. Save the expense being repeated.
        if (!compiledFields[this.name][field.name]) {
            this.log(`Caching [${field.name}] field template for [${this.name}]`)
            compiledFields[this.name][field.name] = dynamicTemplateWire(field.template)
        }

        //Return EVERYTHING that we have found.
        return { field, map, template: compiledFields[this.name][field.name] }
    }
}