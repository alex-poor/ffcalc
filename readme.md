# guide info for FFCalc project

The end goal is to produce an interactive calculator tool which a NZ PHO can use to work with practices to estimate their income.

NZ PHOs distribute funding differently - this work is for a new PHO called 'thePHO' and they want to do a 'bulk funding' model.


## funding

is based on demographics of enrolled patients (and some other variables). There are also specific funding programmes to consider, the main ones being:

### SIA
Formula is available at https://www.tewhatuora.govt.nz/for-health-providers/primary-care-sector/capitation-rates

### Health Promotion
Formula is available at https://www.tewhatuora.govt.nz/for-health-providers/primary-care-sector/capitation-rates

### CarePlus
Formula can be seen in file examples/careplus funding.xlsx

There are additionally a range of other PDF files included in examples/ subdir. Read these for context and understanding.

ASK QUESTIONS IF YOU ARE UNSURE ABOUT ANYTHING.

## output

we need to see Estimated Bulk Funding per Practice broken down across the 3 areas HOP, SIA and CP

The tool should be easy to use, intuitive, and easy to 'scenario model' different mixes of patients and give reliable results.

Practically it cannot be a public web app because of commercial sensitivity. Consider something like an electron app which can be easily used on different devices by people who don't have admin rights to install software.