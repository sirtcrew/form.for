import { FieldContainer } from "./form.fieldContainer.js"

export class Llama extends FieldContainer {
    onchange(e) {

	}
	get view() {
		return {
			content: this.wire(this, ":main")`<div onchange=${this}>${this.template(this)}</div>`,
			elementType: "form"
		}
	}

}