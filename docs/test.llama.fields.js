const { expect } = chai
import sinon from "./lib/sinon-esm.js"
import { bootstrap4 as fieldTypes } from "../src/form.fieldTypes.bootstrap4.js"
import { Llama } from "../src/llama.js"
import { EnumField } from "../src//form.field.js"
let form

describe(`Llama Field Tests: ${name}`, () => {


    before(async () => {
        //Get a JSON schema from somewhere
        const schema = await (await fetch(`./schema.json?${(new Date).valueOf()}`)).json()

        //Build a template that renders your schema properties
        const properties = Object.keys(schema.properties).map(p =>
            `<div class="row my-2 pt-2 border-top">
                    <div class="col-4 text-right font-weight-bold">${`\${obj.fields.${p}.type || "No Type"}:`}</div>
                    <div class="col-8">\${obj.fields.${p}}</div>
                </div>`
        ).join("")
        const template = `<div class="container border border-primary rounded my-3">
                <div class="row my-2 text-center"><h4 class="col-12">Bootstrap 4 FieldTypes</h4></div>
                ${properties}
            </div>`

        //Get some options from somewhere
        const { options } = await import("./options.js")

        //Feed the Llama
        form = new Llama({
            schema, options, fieldTypes, template, value: {
                Position_ID: 30464513,
                RoleEmployee: 261889,
                Employee_ID_Lookup: 311241,
                Appointment_Type: "Temporary",
                Percent_Of_Coolness: 0.9555476,
                Employee_ID: 12345,
                EmployeeName: "Billy",
                Budgeted: "true",
                Reason: "Commence a contract negotiation (Temporary only)",
                Many_Reasons: ["Advertise a permanent position", "Extension of temporary contract"],
                Contract_StartDate: "2019-04-29T14:00:00.000Z",
                Contract_RatDate: "2019-04-29T14:00:00.000Z",
                Contract_StartDateTime: "2019-04-29T14:07:12.000Z",
                Contract_RatDateTime: "2019-04-29T14:07:12.000Z",
                Cost_Centres: [{ Cost_Centre: 60455, Cost_Centre_Percent: 1, Internal_Order_Number: 1 }],
                RetailValue: 69.69
            }
        }).bind(document.body, "div")
        console.log(form)
    })




    it('Schema Type: String', async () => {

        const fieldName = "EmployeeName",
            field = form.fields[fieldName]

        CheckDependency(field)

        //set in inital form data
        checkFormDataToFieldAndElement(fieldName, "Billy")

        //Set on form field
        field.value = "bj"
        checkFormDataToFieldAndElement(fieldName, "bj")

        //set on form
        form.value = { EmployeeName: "Fred" }
        checkFormDataToFieldAndElement(fieldName, "Fred")

        //set through DOM
        setFormElementValue(field, "aaa")
        checkFormDataToFieldAndElement(fieldName, "aaa")

        CheckValidation(field, "Joe", "")

        expectDisabledValueUndefined(field, "Blah")
        expectRedacted(field)
    })

    it('Schema Type: Number', async () => {

        const fieldName = "Employee_ID",
            field = form.fields[fieldName]

        CheckDependency(field)

        //set in inital form data
        checkFormDataToFieldAndElement(fieldName, 12345, "12345")

        //Set on form field
        field.value = 5.88
        checkFormDataToFieldAndElement(fieldName, 5.88, "5.88")

        //set on form
        form.value = { Employee_ID: 10 }
        checkFormDataToFieldAndElement(fieldName, 10, "10")

        //set through DOM
        setFormElementValue(field, 33)
        checkFormDataToFieldAndElement(fieldName, 33, "33")

        CheckValidation(field, 69, "not a number", "Value is not a number")

        expectDisabledValueUndefined(field, 4)
        expectRedacted(field)
    })

    it('Schema Type: Number (Percent)', async () => {

        const fieldName = "Percent_Of_Coolness",
            field = form.fields[fieldName]

        CheckDependency(field)

        //set in inital form data
        checkFormDataToFieldAndElement(fieldName, 0.9555476, "95.5548%")

        //Set on form field
        field.value = 0.5
        checkFormDataToFieldAndElement(fieldName, 0.5, "50%")

        //set on form
        form.value = { Percent_Of_Coolness: 1 }
        checkFormDataToFieldAndElement(fieldName, 1, "100%")

        //set through DOM
        setFormElementValue(field, 33.3333333)
        checkFormDataToFieldAndElement(fieldName, 0.333333333, "33.3333%")

        CheckValidation(field, 0.25, "not a number", "Value is not a number")

        expectDisabledValueUndefined(field, 0.1)
        expectRedacted(field)
    })

    it('Schema Type: Number (Currency)', async () => {

        const fieldName = "RetailValue",
            field = form.fields[fieldName]

        CheckDependency(field)

        //set in inital form data
        checkFormDataToFieldAndElement(fieldName, 69.69, "$69.69")

        //Set on form field
        field.value = 0.5
        checkFormDataToFieldAndElement(fieldName, 0.5, "$0.50")

        //set on form
        form.value = { RetailValue: 1 }
        checkFormDataToFieldAndElement(fieldName, 1, "$1.00")

        //set through DOM
        setFormElementValue(field, 33.3333333)
        checkFormDataToFieldAndElement(fieldName, 33.3333333, "$33.33")

        CheckValidation(field, 0.25, "not a number", "Value is not a number")

        expectDisabledValueUndefined(field, 6)
        expectRedacted(field)
    })

    //Check date fields
    const checkDateFormDataToFieldAndElement = (fieldName, value, elementValue) => {
        let field = form.fields[fieldName]
        expect(form.suppressedSerialValue[fieldName]).to.equal(value)
        expect(field.value.localeISOString).to.equal(field.elementValue).to.equal(elementValue)
    }

    it('Schema Type: Date', async () => {

        const fieldName = "Contract_StartDate",
            field = form.fields[fieldName]

        CheckDependency(field)

        //set in inital form data
        checkDateFormDataToFieldAndElement(fieldName, "2019-04-29T14:00:00.000Z", "2019-04-30")

        //Set on form field
        field.value = "2019-05-15"
        checkDateFormDataToFieldAndElement(fieldName, '2019-05-14T14:00:00.000Z', "2019-05-15")

        //set on form
        form.value = { Contract_StartDate: "2018-04-23" }
        checkDateFormDataToFieldAndElement(fieldName, '2018-04-22T14:00:00.000Z', "2018-04-23")

        //set through DOM
        setFormElementValue(field, "1982-03-16")
        checkDateFormDataToFieldAndElement(fieldName, '1982-03-15T14:00:00.000Z', "1982-03-16")

        CheckValidation(field, "2019-05-15", "1982-13-16", "Date failed to parse")

        expectDisabledValueUndefined(field, "2018-04-21")
        expectRedacted(field)
    })

    it('Schema Type: Date (non-native)', async () => {

        const fieldName = "Contract_RatDate",
            field = form.fields[fieldName]

        CheckDependency(field)

        //set in inital form data
        checkDateFormDataToFieldAndElement(fieldName, "2019-04-29T14:00:00.000Z", "2019-04-30")

        //Set on form field
        field.value = "2019-05-15"
        checkDateFormDataToFieldAndElement(fieldName, '2019-05-14T14:00:00.000Z', "2019-05-15")

        //set on form
        form.value = { [fieldName]: "2018-04-23" }
        checkDateFormDataToFieldAndElement(fieldName, '2018-04-22T14:00:00.000Z', "2018-04-23")

        //set through DOM
        setDatePickerElementValue(field, "1982-03-16")
        checkDateFormDataToFieldAndElement(fieldName, '1982-03-15T14:00:00.000Z', "1982-03-16")

        CheckValidation(field, "2019-05-15", "1982-13-16", "Date failed to parse")

        expectDisabledValueUndefined(field, "2018-04-21")
        expectRedacted(field)
    })

    it('Schema Type: Datetime', async () => {

        const fieldName = "Contract_StartDateTime",
            field = form.fields[fieldName]

        CheckDependency(field)

        //set in inital form data
        checkDateFormDataToFieldAndElement(fieldName, "2019-04-29T14:07:12.000Z", "2019-04-30T00:07")

        //Set on form field
        field.value = "2019-05-15"
        checkDateFormDataToFieldAndElement(fieldName, '2019-05-14T14:00:00.000Z', "2019-05-15T00:00")

        //set on form
        form.value = { [fieldName]: "2018-04-23 16:45" }
        checkDateFormDataToFieldAndElement(fieldName, '2018-04-23T06:45:00.000Z', "2018-04-23T16:45")

        //set through DOM
        setFormElementValue(field, "1982-03-16T10:13")
        checkDateFormDataToFieldAndElement(fieldName, '1982-03-16T00:13:00.000Z', "1982-03-16T10:13")

        CheckValidation(field, "2019-05-15", "1982-12-16 25:89", "Date failed to parse")

        expectDisabledValueUndefined(field, "2018-04-21")
        expectRedacted(field)
    })

    it('Schema Type: Datetime (non-native)', async () => {

        const fieldName = "Contract_RatDateTime",
            field = form.fields[fieldName]

        CheckDependency(field)

        //set in inital form data
        checkDateFormDataToFieldAndElement(fieldName, "2019-04-29T14:07:12.000Z", "2019-04-30T00:07")

        //Set on form field
        field.value = "2019-05-15"
        checkDateFormDataToFieldAndElement(fieldName, '2019-05-14T14:00:00.000Z', "2019-05-15T00:00")

        //set on form
        form.value = { [fieldName]: "2018-04-23 16:45" }
        checkDateFormDataToFieldAndElement(fieldName, '2018-04-23T06:45:00.000Z', "2018-04-23T16:45")

        //set through DOM
        setDatePickerElementValue(field, "1982-03-16T10:13")
        checkDateFormDataToFieldAndElement(fieldName, '1982-03-16T00:13:00.000Z', "1982-03-16T10:13")

        CheckValidation(field, "2019-05-15", "1982-12-16 25:89", "Date failed to parse")

        expectDisabledValueUndefined(field, "2018-04-21")
        expectRedacted(field)
    })




    it('Schema: Enum', async () => {

        //Check that a missing enum will fail with an error
        expect(() => new EnumField({ schema: {}, options: {} })).to.throw("Enum field [undefined] has been constructed without a enum specified in schema or options")

        const fieldName = "Reason",
            field = form.fields[fieldName]

        CheckDependency(field)

        //set in inital form data
        checkFormDataToFieldAndElement(fieldName, 'Commence a contract negotiation (Temporary only)')

        //Set on form field
        field.value = "Extension of temporary contract"
        checkFormDataToFieldAndElement(fieldName, "Extension of temporary contract")

        //set on form
        form.value = { [fieldName]: "Other" }
        checkFormDataToFieldAndElement(fieldName, "Other")

        //set through DOM
        //reset field
        const options = field.element.querySelectorAll("option:not([hidden]):not([disabled])")
        options[2].selected = true
        field.formElement.dispatchEvent(new Event('change', { bubbles: true }))
        expect(form.value[fieldName]).to.equal(field.value).to.equal(field.elementValue).to.equal('Commence a contract negotiation (Temporary only)')

        CheckValidation(field, "Extension of temporary contract", "no reasonz", "Selected value is invalid")

        expectDisabledValueUndefined(field, "Other")
        expectRedacted(field)
    })

    it('Schema: Enum (Multiple)', async () => {

        const fieldName = "Many_Reasons",
            field = form.fields[fieldName],
            element = field.formElement

        CheckDependency(field)
        //set in inital form data
        expect(form.value[fieldName]).to.equal(field.value).to.eql(
            Array.from(element.querySelectorAll("option:not([hidden]):not([disabled]):checked")).map(o => o.textContent)
        )

        //Set on form field
        const reasons1 = ["Commence a contract negotiation (Temporary only)", "Extension of temporary contract"]

        field.value = reasons1

        expect(form.value[fieldName]).to.equal(reasons1).to.equal(field.value).to.eql(
            Array.from(element.querySelectorAll("option:not([hidden]):not([disabled]):checked")).map(o => o.textContent)
        )

        //set on form
        const reasons2 = ["Advertise a permanent position",
            "Advertise a temporary position",
            "Commence a contract negotiation (Temporary only)",
            "Extension of temporary contract",
            "Other"]

        form.value = { [fieldName]: reasons2 }

        expect(form.value[fieldName]).to.equal(reasons2).to.equal(field.value).to.eql(
            Array.from(element.querySelectorAll("option:not([hidden]):not([disabled]):checked")).map(o => o.textContent)
        )

        //set through DOM
        //reset field
        field.value = []

        const options = element.querySelectorAll("option:not([hidden]):not([disabled])")
        options[0].selected = true
        options[3].selected = true
        element.dispatchEvent(new Event('change', { bubbles: true }))

        expect(form.value[fieldName]).to.equal(field.value).to.eql(
            Array.from(element.querySelectorAll("option:not([hidden]):not([disabled]):checked")).map(o => o.textContent)
        )

        CheckValidation(field, "Extension of temporary contract", "no reasonz", "Selected value is invalid")

        expectDisabledValueUndefined(field, ["Extension of temporary contract"])
        expectRedacted(field)

    })

    it('Schema Type: Boolean', async () => {

        const fieldName = "Budgeted",
            field = form.fields[fieldName],
            element = field.formElement

        CheckDependency(field)

        //set in inital form data
        expect(form.value[fieldName]).to.equal(field.value).to.equal(element.checked).to.be.true

        //Set on form field
        field.value = false

        expect(form.value[fieldName]).to.equal(field.value).to.equal(element.checked).to.be.false

        //set on form
        form.value = { Budgeted: true }
        expect(form.value[fieldName]).to.equal(field.value).to.equal(element.checked).to.be.true

        //set through DOM
        element.checked = false
        element.dispatchEvent(new Event('change', { bubbles: true }))
        expect(form.value[fieldName]).to.equal(field.value).to.equal(element.checked).to.be.false

        expectDisabledValueUndefined(field, true)
        expectRedacted(field)

    })

    it('Field Type: Label', async () => {

        const fieldName = "Note",
            field = form.fields[fieldName]

        CheckDependency(field)

        //Set value on form field
        expect(() => { field.value = "some value that shouldn't be returned or rendered" }).to.throw("Setters are not used on AlwaysValid fields")
        expect(field.value).to.be.undefined

        //set on form
        expect(() => { form.value = { Note: true } }).to.throw("Setters are not used on AlwaysValid fields")
        expect(form.value[fieldName]).to.be.undefined

        //Check label value
        expect(field.element.querySelector("small").innerText).to.equal("This is a really cool label")

        //Check values
        expect(field.elementValue).to.equal(field.defaultSelectOption).to.equal(field.domValue).to.equal(field.suppressedSerialValue).to.equal(field.value).to.equal(undefined)

        expect(() => { expectDisabledValueUndefined(field, "fghfgh") }).to.throw("Setters are not used on AlwaysValid fields")
    })


    it('fieldType: Radio', async () => {

        const field = form.fields.Appointment_Type
        const div = form.element

        CheckDependency(field)

        //set in inital form data
        expect(form.value.Appointment_Type).to.equal(field.value).to.equal(div.querySelector("input[name=Appointment_Type]:checked").value).to.equal("Temporary")

        //Set on form field
        field.value = "Casual"
        expect(form.value.Appointment_Type).to.equal(field.value).to.equal(div.querySelector("input[name=Appointment_Type]:checked").value).to.equal("Casual")

        //set on form
        form.value = { Appointment_Type: "Permanent" }
        expect(form.value.Appointment_Type).to.equal(field.value).to.equal(div.querySelector("input[name=Appointment_Type]:checked").value).to.equal("Permanent")

        //set through DOM
        const el = div.querySelector("input[value=Temporary]")
        el.checked = true
        el.dispatchEvent(new Event('change', { bubbles: true }))
        expect(form.value.Appointment_Type).to.equal(field.value).to.equal(div.querySelector("input[name=Appointment_Type]:checked").value).to.equal("Temporary")

        CheckValidation(field, "Casual", "blah Permanent", "Selected value is invalid")

        expectDisabledValueUndefined(field, "Casual", 3)
        expectRedacted(field)
    })
    it('fieldType: Table', async () => {

    })
    it('fieldType: Array', async () => {

        const field = form.fields.Cost_Centres
        const div = form.element

        const parent = {
            validate: () => ({ valid: true, message: "" }),
            property: "ParentField",
            visible: true
        }

        CheckDependency(field)

        const checkValues = () => {
            for (const index in field.rows) {
                const fields = field.rows[index].fields
                for (const fieldName in field.schema.properties) {
                    expect(form.suppressedSerialValue.Cost_Centres[index][fieldName]).to.equal(fields[fieldName].suppressedSerialValue)
                }
            }
        }
        //set in inital form data
        checkValues()

        //Set on form field
        field.value = [{ Cost_Centre: 60455, Cost_Centre_Percent: .40, Internal_Order_Number: 1 }, { Cost_Centre: 60454, Cost_Centre_Percent: .60, Internal_Order_Number: null }]
        checkValues()

        //set on form
        form.value = {
            Cost_Centres: [
                { Cost_Centre: 65555, Cost_Centre_Percent: .5, Internal_Order_Number: 1 },
                { Cost_Centre: 66666, Cost_Centre_Percent: .15, Internal_Order_Number: null },
                { Cost_Centre: 60899, Cost_Centre_Percent: .80, Internal_Order_Number: null, Date_Of_Something: "2019-12-31" }
            ]
        }
        checkValues()



        //set through DOM
        const el = field.rows[1].fields.Internal_Order_Number.formElement
        el.value = 99991234
        el.dispatchEvent(new Event('change', { bubbles: true }))
        expect(field.rows[1].fields.Internal_Order_Number.value).to.equal(99991234)
        checkValues()


        //clear all data
        form.value = { Cost_Centres: [] }
        expect(field.rows.length).to.equal(form.value.Cost_Centres.length).to.equal(0)

        const formChange = sinon.stub(form, "changed")
        //add new rows
        field.plusButton.onclick()
        field.plusButton.onclick()
        expect(formChange.called).to.be.true

        expect(field.rows.length).to.equal(form.value.Cost_Centres.length).to.equal(2)

        //remove row
        field.removeRow(0)
        expect(field.rows.length).to.equal(form.value.Cost_Centres.length).to.equal(1)

        const nodeList = div.querySelectorAll("div.row.mb-3")
        expect(nodeList.length).to.equal(1)
        expect(nodeList[0].textContent).to.contain("Cost Centre (required)")

        //remove all rows
        field.value = []
        field.removeRow()
        expect(field.validation.message).to.equal("Field is required")
        expect(field.validation.valid).to.be.false

        //hide field based on dependency
        parent.value = 6
        field.dependencyChange(parent)

        //Should be valid when not shown (even with invalid value set)
        expect(field.validation.valid).to.be.true

        //show field based on dependency
        parent.value = 5
        field.dependencyChange(parent)

        //clear field values
        field.value = []

        //Check that the 'required' message is displayed
        expect(Object.values(field.element.querySelectorAll("small")).filter(e => e.innerText === "Field is required" && (e.style.color === "rgb(230, 71, 89)" || e.className === "text-danger")).length).to.equal(1)

        //set one row to be invalid
        field.value = [
            { Cost_Centre: 60455, Cost_Centre_Percent: .40, Internal_Order_Number: 1 },
            { Cost_Centre: null, Cost_Centre_Percent: null, Internal_Order_Number: null }
        ]

        checkValues()
        expect(field.validation.message).to.equal("1 or more array rows are invalid")
        expect(field.validation.valid).to.be.false

        //set correct value
        field.value = [
            { Cost_Centre: 60455, Cost_Centre_Percent: .40, Internal_Order_Number: 1 },
            { Cost_Centre: 60454, Cost_Centre_Percent: .60, Internal_Order_Number: null }
        ]

        checkValues()
        expect(field.validation.message).to.equal("Field is valid")
        expect(field.validation.valid).to.be.true

        //expectDisabledValueUndefined
        field.value = [{ Cost_Centre: 60455 }]

        field.disabled = true
        expect(field.suppressedSerialValue).to.be.undefined
        expect(field.readonly).to.be.true
        expect(field.element.querySelectorAll("input:disabled").length).to.equal(5)

        field.disabled = false

        expect(field.element.querySelector("input:disabled")).to.be.null

        expectRedacted(field)
    })
})

const expectDisabledValueUndefined = (field, value, disabledInputCount = 1) => {

    field.value = value
    field.disabled = true

    expect(field.suppressedSerialValue).to.be.undefined

    expect(field.element.querySelectorAll("input:disabled, select:disabled").length).to.equal(disabledInputCount)

    field.disabled = false
    expect(field.element.querySelector("input:disabled, select:disabled")).to.be.null
}
//Check simple Fields
const checkFormDataToFieldAndElement = (fieldName, value, elementValue) => {
    let field = form.fields[fieldName]

    if (elementValue) {
        expect(form.value[fieldName]).to.equal(field.value).to.equal(value)
        expect(field.elementValue).to.equal(elementValue)

    } else {
        expect(form.value[fieldName]).to.equal(field.value).to.equal(field.elementValue).to.equal(value)
    }
}
const expectRedacted = (field) => {
    //Check for redacted class
    expect(field.element.querySelector(".bg-redacted")).to.be.null
    field.redacted = true

    //Check for redacted class
    expect(field.element.querySelector(".bg-redacted")).not.to.be.null
    field.redacted = false
}
const CheckValidation = (field, goodValue, badValue, badMessage = "Field is required") => {

    const parent = {
        validate: () => ({ valid: true, message: "" }),
        property: "ParentField",
        visible: true
    }
    //Check field responds to dependency change and is valid when not displayed

    //set incorrect value
    field.value = badValue
    expect(field.validation.message).to.equal(badMessage)
    expect(field.validation.valid).to.be.false

    //Check that the 'required' message is displayed
    expect(Object.values(field.element.querySelectorAll("small")).filter(e => e.innerText === badMessage && (e.style.color === "rgb(230, 71, 89)" || e.className === "text-danger")).length).to.equal(1)

    //hide field based on dependency
    parent.value = 6
    field.dependencyChange(parent)

    //Should be valid when not shown (even with invalid value set)
    expect(field.validation.valid).to.be.true

    //show field based on dependency
    parent.value = 5
    field.dependencyChange(parent)

    //set correct value
    field.value = goodValue
    expect(field.validation.message).to.equal("Field is valid")
    expect(field.validation.valid).to.be.true
}
const setFormElementValue = (field, value) => {
    field.formElement.value = value
    field.formElement.dispatchEvent(new Event('change', { bubbles: true }))
}
const setDatePickerElementValue = (field, value) => {
    field.formElement.value = value
    //https://gist.github.com/sinpaout/acbf971076de7ab1bdd93616313d13ce
    //Reason: https://stackoverflow.com/questions/8942678/keyboardevent-in-chrome-keycode-is-0/12522752#12522752
    const ev = document.createEvent('Events')
    ev.initEvent('keydown', true, true) // <-- flatpickr uses keydown with keycode
    ev.keyCode = 13
    ev.which = 13
    ev.charCode = 13
    ev.key = 'Enter'
    ev.code = 'Enter'
    field.formElement.dispatchEvent(ev)
}

const CheckDependency = (field) => {
    const fieldvalue = field.suppressedSerialValue

    //Set dependency
    const parent = {
        validate: () => ({ valid: true, message: "" }),
        property: "ParentField",
        visible: true
    }

    field.dependencies = [{
        propertyName: "ParentField",
        condition: fieldInstance => fieldInstance.value === 5
    }]

    //set invalid value on parent to hide field
    parent.value = 6
    field.dependencyChange(parent)
    expect(field.element.querySelector(`#${field.id}`)).to.be.null
    expect(field.suppressedSerialValue).to.be.undefined

    //set valid value on parent to show field
    parent.value = 5

    field.dependencyChange(parent)
    expect(field.element.querySelector(`#${field.id}`)).not.to.be.null
    expect(field.suppressedSerialValue).to.deep.equal(fieldvalue)
}
