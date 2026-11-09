'use client'

import { Select as AntSelect, type SelectProps } from 'antd'

// Generic so option values stay typed at the call site.
const Select = <Value = string,>(props: SelectProps<Value>) => <AntSelect<Value> {...props} />

export default Select
