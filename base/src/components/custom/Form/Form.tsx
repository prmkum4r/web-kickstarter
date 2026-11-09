'use client'

import { Form as AntForm, type FormProps as AntFormProps } from 'antd'
import type { ReactNode } from 'react'

// antd's JSX typing only accepts ReactNode children, so render-prop children are not offered.
export type FormProps<Values> = Omit<AntFormProps<Values>, 'children'> & { children?: ReactNode }

// Project defaults: vertical layout, no required-mark asterisk (required fields say so in their rules).
const FormRoot = <Values,>(props: FormProps<Values>) => (
  <AntForm<Values> layout="vertical" requiredMark={false} {...props} />
)

const Form = Object.assign(FormRoot, {
  Item: AntForm.Item,
  List: AntForm.List,
  ErrorList: AntForm.ErrorList,
  Provider: AntForm.Provider,
  useForm: AntForm.useForm,
  useWatch: AntForm.useWatch,
  useFormInstance: AntForm.useFormInstance,
})

export default Form
