---
applyTo:
  - "src/components/form/**"
  - "src/components/modal/**"
---

# React Form Handling & Validation

> **Related Instructions**:
>
> - [react-components.instructions.md](./react-components.instructions.md) - Component patterns
> - [react-hooks.instructions.md](./react-hooks.instructions.md) - Hooks

## Form Patterns

🔴 **CRITICAL**: All forms use controlled components with React state.

### Controlled Components

```typescript
import { useState, FormEvent, ChangeEvent } from "react";
import { Form } from "react-bootstrap";

const MyForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: ""
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Submit logic
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Control
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <Form.Control
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <button type="submit">Submit</button>
    </Form>
  );
};
```

## Reusable Form Components

This project has standardized form components in `src/components/form/`:

### GenericInputField

```typescript
import GenericInputField from "../form/input";

<GenericInputField
  label={t("map.mapName")}
  name="name"
  handleChange={(e) => setName(e.target.value)}
  changeValue={name}
  required={true}
  placeholder={t("map.namePlaceholder")}
  information={t("map.nameInfo")} // Optional help text
/>
```

### GenericTextAreaField

```typescript
import GenericTextAreaField from "../form/textarea";

<GenericTextAreaField
  label={t("territory.description")}
  name="description"
  handleChange={(e) => setDescription(e.target.value)}
  changeValue={description}
  rows={4}
  placeholder={t("territory.descPlaceholder")}
/>
```

### StatusField

```typescript
import StatusField from "../form/status";

<StatusField
  currentStatus={status}
  handleClick={(newStatus) => setStatus(newStatus)}
/>
```

### HouseholdField

```typescript
import HouseholdField from "../form/household";

<HouseholdField
  householdTypes={["Chinese", "Malay", "English"]}
  currentType={type}
  handleClick={(newType) => setType(newType)}
/>
```

### FloorField

```typescript
import FloorField from "../form/floors";

<FloorField
  floors={5}
  handleFloorChange={(newFloors) => setFloors(newFloors)}
/>
```

### RoleSelector

```typescript
import RoleSelector from "../form/role";

<RoleSelector
  currentRole={role}
  handleRoleChange={(newRole) => setRole(newRole)}
/>
```

### ModalFooter

```typescript
import ModalFooter from "../form/footer";

<ModalFooter
  handleClick={modal.hide}
  handleSave={handleSubmit}
  isSaving={isLoading}
  saveLabel={t("common.save")}
  closeLabel={t("common.cancel")}
/>
```

### SubmitButton

```typescript
import SubmitBtn from "../form/submit";

<SubmitBtn
  isSaving={isLoading}
  btnLabel={t("common.submit")}
/>
```

## Form Validation

🟡 **IMPORTANT**: Use Bootstrap validation with `validated` prop.

```typescript
import { useState, FormEvent } from "react";
import { Form } from "react-bootstrap";

const ValidatedForm = () => {
  const [validated, setValidated] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (form.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    // Form is valid - proceed with submission
    submitData(formData);
  };

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit}>
      <Form.Group>
        <Form.Label>{t("form.name")}</Form.Label>
        <Form.Control
          required
          type="text"
          name="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
        <Form.Control.Feedback type="invalid">
          {t("validation.nameRequired")}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group>
        <Form.Label>{t("form.email")}</Form.Label>
        <Form.Control
          required
          type="email"
          name="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        />
        <Form.Control.Feedback type="invalid">
          {t("validation.emailInvalid")}
        </Form.Control.Feedback>
      </Form.Group>

      <button type="submit">{t("common.submit")}</button>
    </Form>
  );
};
```

### Custom Validation

```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

const validateForm = () => {
  const newErrors: Record<string, string> = {};

  if (!formData.name.trim()) {
    newErrors.name = t("validation.nameRequired");
  }

  if (formData.name.length > 50) {
    newErrors.name = t("validation.nameTooLong");
  }

  if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    newErrors.email = t("validation.emailInvalid");
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = (e: FormEvent) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  // Submit valid form
  submitData(formData);
};
```

## Form Submission

### Async Submission with Loading State

```typescript
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  setIsLoading(true);
  try {
    await submitToAPI(formData);
    alert(t("success.saved"));
    resetForm();
  } catch (error) {
    errorHandler(error);
  } finally {
    setIsLoading(false);
  }
};

return (
  <Form onSubmit={handleSubmit}>
    {/* Form fields */}
    <button type="submit" disabled={isLoading}>
      {isLoading ? t("common.loading") : t("common.submit")}
    </button>
  </Form>
);
```

## Modal Forms

Complete modal form example with NiceModal:

```typescript
import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { Modal, Form } from "react-bootstrap";
import { useState, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import GenericInputField from "../form/input";
import ModalFooter from "../form/footer";
import errorHandler from "../../utils/helpers/errorhandler";

interface MyFormModalProps {
  initialData?: {
    name: string;
    description: string;
  };
}

const MyFormModal = NiceModal.create<MyFormModalProps>(({ initialData }) => {
  const modal = useModal();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || ""
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (form.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    setIsLoading(true);
    try {
      await saveData(formData);
      alert(t("success.saved"));
      modal.resolve(formData); // Return data to caller
      modal.hide();
    } catch (error) {
      errorHandler(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{t("modal.title")}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <GenericInputField
            label={t("form.name")}
            name="name"
            handleChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            changeValue={formData.name}
            required={true}
          />

          <GenericInputField
            label={t("form.description")}
            name="description"
            handleChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            changeValue={formData.description}
          />
        </Modal.Body>

        <ModalFooter
          handleClick={modal.hide}
          isSaving={isLoading}
        />
      </Form>
    </Modal>
  );
});

export default MyFormModal;
```

## Common Form Patterns

### Select Dropdown

```typescript
<Form.Select
  name="type"
  value={formData.type}
  onChange={handleChange}
  required
>
  <option value="">{t("form.selectOption")}</option>
  <option value="type1">{t("types.type1")}</option>
  <option value="type2">{t("types.type2")}</option>
</Form.Select>
```

### Checkbox

```typescript
const [isAgreed, setIsAgreed] = useState(false);

<Form.Check
  type="checkbox"
  label={t("form.agreeTerms")}
  checked={isAgreed}
  onChange={(e) => setIsAgreed(e.target.checked)}
  required
/>
```

### Radio Buttons

```typescript
const [selectedOption, setSelectedOption] = useState("option1");

<Form.Check
  type="radio"
  name="options"
  label={t("form.option1")}
  value="option1"
  checked={selectedOption === "option1"}
  onChange={(e) => setSelectedOption(e.target.value)}
/>
<Form.Check
  type="radio"
  name="options"
  label={t("form.option2")}
  value="option2"
  checked={selectedOption === "option2"}
  onChange={(e) => setSelectedOption(e.target.value)}
/>
```

### File Upload

```typescript
const [file, setFile] = useState<File | null>(null);

const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    setFile(e.target.files[0]);
  }
};

<Form.Control
  type="file"
  accept=".csv,.xlsx"
  onChange={handleFileChange}
/>
```

### Floating Labels

```typescript
import { FloatingLabel, Form } from "react-bootstrap";

<FloatingLabel label={t("form.email")}>
  <Form.Control
    type="email"
    placeholder={t("form.emailPlaceholder")}
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</FloatingLabel>
```

## Form Reset

```typescript
const initialFormData = {
  name: "",
  email: "",
  type: ""
};

const [formData, setFormData] = useState(initialFormData);

const resetForm = () => {
  setFormData(initialFormData);
  setValidated(false);
  setErrors({});
};

// After successful submission
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  // ...submission logic
  resetForm();
};
```

## Form Best Practices

🔴 **CRITICAL**:

1. Always use controlled components
2. Always call `preventDefault()` on form submit
3. Always show loading state during async operations
4. Always use errorHandler for async errors
5. Always translate user-facing text with i18n

🟡 **IMPORTANT**:

1. Validate on submit, not on change (better UX)
2. Show validation feedback clearly
3. Disable submit button while loading
4. Reset form after successful submission
5. Use consistent spacing and layout

🟢 **RECOMMENDED**:

1. Use reusable form components from `components/form/`
2. Group related fields with Form.Group
3. Add help text for complex fields
4. Use appropriate input types (email, number, date)
5. Add autocomplete attributes for better UX

---

**Last Updated**: October 2024  
**React Version**: 19.x (see `package.json`)
