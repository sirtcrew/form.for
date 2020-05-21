export const options = {
    "fields": {
        "EmployeeName": {
            "label": "Employee Name",
            "helper": "This is a String field"
        },
        "Percent_Of_Coolness": {
            "label": "Percent Of Coolness",
            "decimalPlaces": 4,
            "helper": "This is a Percent field"
        },
        "Employee_ID": {
            "label": "Employee ID",
            "helper": "This is a Number field"
        },
        "Budgeted": {
            "label": "Budgeted",
            "helper": "This is a Boolean field"
        },
        "Contract_StartDate": {
            "label": "Vacancy Start Date - Native",
            "helper": "This is a Date field"
        },
        "Contract_RatDate": {
            "label": "Vacancy Start Date - Fallback",
            "type": "date-fallback",
            "helper": "This is a Date fallback field"
        },
        "Contract_StartDateTime": {
            "label": "Vacancy Start DateTime - Native",
            "helper": "This is a DateTime field"
        },
        "Contract_RatDateTime": {
            "label": "Vacancy Start DateTime - Fallback",
            "type": "datetime-fallback",
            "helper": "This is a DateTime Fallback field"
        },
        "Reason": {
            "type": "select",
            "label": "Request Reason",
            "defaultSelectOption": "Please Select...",
            "helper": "This is a Select field"
        },
        "Many_Reasons": {
            "type": "select",
            "label": "Many Request Reasons",
            "multiple": true,
            "helper": "This is a Multi Select field"
        },
        "Appointment_Type": {
            "type": "radio",
            "label": "Appointment Type",
            "optionLabels": ["_Casual", "_Temporary", "_Permanent"],
            "parentClasses": "form-check-inline",
            "sort": false,
            "helper": "This is a radio field"
        },
        "Cost_Centres": {
            "template": `
                <div class="row">
                    <div class='col-12 col-md-3'>\${obj.fields.Cost_Centre}</div>
                    <div class='col-12 col-md-3'>\${obj.fields.Cost_Centre_Percent}</div>
                    <div class='col-12 col-md-3'>\${obj.fields.Internal_Order_Number}</div>
                    <div class='col-12 col-md-3'>\${obj.fields.Date_Of_Something}</div>
                    </div>
                    <div class="row">
                    <div class='col-12'>\${obj.fields.Position_Lookup}</div>
                </div>
            `,
            "fields": {
                "Cost_Centre": {
                    "label": "Cost Centre",
                    "type": "number"
                },
                "Cost_Centre_Percent": {
                    "label": "Percent"
                },
                "Internal_Order_Number": {
                    "label": "Internal Order Number"
                },
                "Date_Of_Something": {
                    "label": "Date Of Something",
                    "type": "date-fallback"
                },
                "Position_Lookup": {
                    "label": "Position Lookup",
                    "type": "position"
                }
            },
            "helper": "This is an Array field",
            "label": "Cost Centres"
        },
        "RetailValue": {
            "label": "Retail/assessed value of gift",
            "helper": "This is a Currency field"
        },
        "Note": {
            "label": `This is a really cool label`,
            "type": "label"
        }
    }
}