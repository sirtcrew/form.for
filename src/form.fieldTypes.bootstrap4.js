import { FieldTypes } from "./form.fieldTypes.js"
import { nativeDate } from "./helpers.js"
import * as basicFields from "./form.field.js"
import * as dateFields from "./form.field.dates.js"
import * as customFields from "./form.field.custom.js"
import * as arrayFields from "./form.field.array.js"
import * as sectionFields from "./form.field.section.js"
import * as approvalSectionFields from "./form.field.approvalSection.js"

const fields = Object.assign({}, basicFields, dateFields, customFields, arrayFields, sectionFields, approvalSectionFields)

const textDangerClass = '(obj.displayValidationErrors && !obj.validation.valid ? " text-danger" : "")',
	borderDangerClass = '(obj.displayValidationErrors && !obj.validation.valid ? " border-danger" : "")',
	label = '${obj.label && [`<label class="${' + textDangerClass + '}" for="${obj.id}">${obj.label + (obj.options.required ? " (required)" : "")}</label>`] || ""}',
	help = '${obj.helper && [`<small class="form-text ${' + textDangerClass + ' || "text-muted"}">${obj.helper}</small>`]}',
	validationMessage = '${obj.displayValidationErrors && !obj.validation.valid && [`<small class="text-danger">${obj.validation.message}</small>`] || ""}',
	fieldClasses = 'class=${"form-control " + obj.options.classes + ' + borderDangerClass + '}',
	genericAttributes = 'required=${obj.options.required} disabled=${obj.disabled || obj.readonly} onchange=${obj.onchange} onblur=${obj.onblur} name="${obj.name}" placeholder="${obj.options.placeholder}"',
	redacted = '${obj.redacted ? [`<div title="Field has been redacted" class="form-control hs-icon hs-icon-hidden hs-icon-text bg-redacted" style="font-size: 20px; display: flex; justify-content: flex-end; align-items: center ;position: absolute; height: 100%; width: 100%; z-index: 1000;"></div>`] : ""}'

export const bootstrap4 = new FieldTypes({
	name: "bootstrap4",
	mappings: {
		percent: {
			field: "input-percent"
		},
		currency: {
			field: "input-currency"
		},
		number: {
			field: "input-number"
		},
		string: {
			field: "input"
		},
		label: {
			field: "label"
		},
		boolean: {
			field: "checkbox"
		},
		date: {
			field: nativeDate ? "date-native" : "date-fallback"
		},
		datetime: {
			field: nativeDate ? "datetime-native" : "datetime-fallback"
		},
		array: {
			field: "array"
		}
	},
    fields: [
        {
            fieldClass: fields.default,
            name: "field",
            template: ``
        },
		{
			fieldClass: fields.RadioField,
			name: "radio",
			template: `<div id="\${obj.id}"><div>${label}</div><div style="position: relative">${redacted}\${obj.list.map(i => wire(i)\`<div class="\${"form-group form-check " + (obj.options.parentClasses || "")}"><label><input ${genericAttributes} class="\${"form-check-input " + obj.options.classes}" checked=\${i.checked} type='radio' value='\${i.value}'>\${i.name}</label></div>\`)}</div>${help}${validationMessage}</div>`
		},
		{
			fieldClass: fields.SelectField,
			name: "select",
			template: `<div class=\${"form-group " + (obj.options.parentClasses || "")}>${label}<div style="position: relative">${redacted}<select ${genericAttributes} id="\${obj.id}" ${fieldClasses}  size=\${obj.options.size || obj.options.multiple ? 5 : 1} multiple=\${obj.options.multiple}><option hidden disabled selected value>\${obj.defaultSelectOption}</option>\${obj.list.map(i => \`<option value="\${i.value}" \${i.selected ? "selected" : ""}>\${i.name}</option>\`)}</select></div>${help}${validationMessage}</div>`
		},
		{
			fieldClass: fields.PercentField,
			name: "input-percent",
			template: `<div class=\${"form-group " + (obj.options.parentClasses || "")}>${label}<div style="position: relative">${redacted}<input ${genericAttributes} id="\${obj.id}" ${fieldClasses}  type='text' value='\${obj.domValue}'></div>${help}${validationMessage}</div>`
		},
		{
			fieldClass: fields.CurrencyField,
			name: "input-currency",
			template: `<div class=\${"form-group " + (obj.options.parentClasses || "")}>${label}<div style="position: relative">${redacted}<input ${genericAttributes} id="\${obj.id}" ${fieldClasses}  type='text' value='\${obj.domValue}'></div>${help}${validationMessage}</div>`
		},
		{
			fieldClass: fields.NumberField,
			name: "input-number",
			template: `<div class=\${"form-group " + (obj.options.parentClasses || "")}>${label}<div style="position: relative">${redacted}<input ${genericAttributes} id="\${obj.id}" ${fieldClasses}  type='number' value='\${obj.domValue}'></div>${help}${validationMessage}</div>`
		},
		{
			fieldClass: fields.StringField,
			name: "input",
			template: `<div class=\${"form-group " + (obj.options.parentClasses || "")}>${label}<div style="position: relative">${redacted}<input ${genericAttributes} id="\${obj.id}" ${fieldClasses}  type='text' value='\${obj.domValue}'></div>${help}${validationMessage}</div>`
		},
		{
			fieldClass: fields.Label,
			name: "label",
			template: `<small style="white-space: pre-wrap;" id="\${obj.id}">\${obj.label}</small>`
		},
		{
			fieldClass: fields.Button,
			name: "button",
			template: `<button onclick=\${obj.onclick} id="\${obj.id}" type="button" class="btn btn-secondary"><span aria-hidden="true">\${obj.label}</span></button>`
		},
		{
			fieldClass: fields.BooleanField,
			name: "checkbox",
			template: `<div class=\${"form-group form-check " + (obj.options.parentClasses || "")}><div style="position: relative">${redacted}<input ${genericAttributes} id="\${obj.id}" class="\${"form-check-input " + obj.options.classes}" type='checkbox' checked='\${obj.domValue}'></div>${label}${help}${validationMessage}</div>`
		},
		{
			fieldClass: fields.DateField,
			name: "date-native",
			template: `<div class=\${"form-group " + (obj.options.parentClasses || "")}>${label}<div style="position: relative">${redacted}<input ${genericAttributes} id="\${obj.id}" ${fieldClasses} type='date' value=\${obj.domValue}></div>${help}${validationMessage}</div>`
		},
		{
			fieldClass: fields.DateFallbackField,
			name: "date-fallback",
			template: `<div class=\${"form-group " + (obj.options.parentClasses || "")}>${label}<div style="position: relative">${redacted}<input ${genericAttributes} id="\${obj.id}" ${fieldClasses} type='text'></div>${help}${validationMessage}</div>`
		},
		{
			fieldClass: fields.DateTimeField,
			name: "datetime-native",
			template: `<div class=\${"form-group " + (obj.options.parentClasses || "")}>${label}<div style="position: relative">${redacted}<input ${genericAttributes} id="\${obj.id}" ${fieldClasses} type='datetime-local' value=\${obj.domValue}></div>${help}${validationMessage}</div>`
		},
		{
			fieldClass: fields.DateTimeFallbackField,
			name: "datetime-fallback",
			template: `<div class=\${"form-group " + (obj.options.parentClasses || "")}>${label}<div style="position: relative">${redacted}<input ${genericAttributes} id="\${obj.id}" ${fieldClasses} type='text'></div>${help}${validationMessage}</div>`
		},
		{
			fieldClass: fields.ArrayField,
			name: "array",
			template: `<div onchange=\${obj.onchange} id="\${obj.id}" class=\${"form-group " + (obj.options.parentClasses || "")}>${label}<div style="position: relative">${redacted}\${[...obj.rows]}\${obj.plusButton}</div>${help}${validationMessage}</div>`,
        },
		{
			fieldClass: fields.SectionField,
			name: "section"
		},
		{
			fieldClass: fields.ApprovalSectionField,
			name: "approvalSection"
		},
		{
			fieldClass: fields.StringField,
			name: "textarea",
			template: `<div class=\${"form-group " + (obj.options.parentClasses || "")}>${label}<div style="position: relative">${redacted}<textarea ${genericAttributes} id="\${obj.id}" class="\${"form-control " + obj.options.classes}" rows="\${obj.options.rows || 3}" value="\${obj.domValue}"></textarea></div>${help}${validationMessage}</div>`
		},
		{
			fieldClass: fields.CustomField,
			name: "custom",
			template: `<div id="\${obj.id}" class=\${"form-group " + (obj.options.parentClasses || "")}>${label}<div style="position: relative">${redacted}\${obj.customFieldInstance}</div>${help}${validationMessage}</div>`
		}
	]
})