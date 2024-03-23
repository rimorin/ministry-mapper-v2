import { User } from "firebase/auth";
import { LinkSession, Policy } from "./policies";
// import { ColorPaletteProp } from "@mui/joy";

interface territoryInterface {
  territoryId: string;
}
interface mapInterface {
  mapId: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}
interface userInterface {
  user: User;
}

interface updateInterface {
  updatedBy: string;
}

interface nameInterface {
  name: string;
}

interface postalInterface {
  postalCode: string;
}

interface congregationInterface {
  congregation: string;
}

interface footerInterface {
  footerSaveAcl: number;
}

interface floorInterface {
  floor: number;
  floorDisplay?: string;
}

export interface unitDetails {
  addressId: string;
  number: string;
  note: string;
  type: string;
  status: number;
  nhcount: number;
  dnctime: number;
  sequence?: number;
  propertyPostal?: string;
}

export interface nothomeProps {
  nhcount?: number;
  classProp?: string;
}

export interface floorDetails extends floorInterface {
  units: Array<unitDetails>;
}

export interface unitProps {
  type: string;
  note?: string;
  status: number;
  nhcount?: number;
  defaultOption?: string;
}

export interface valuesDetails
  extends floorInterface,
    nameInterface,
    mapInterface,
    territoryInterface {
  unit: string;
  unitDisplay?: string;
  type: string;
  note: string;
  postal?: string;
  feedback: string;
  status: string;
  link?: string;
  nhcount?: string;
  units?: string;
  floors?: number;
  newPostal?: string;
  code?: string;
  dnctime?: number;
  sequence: string;
  unitlength?: number;
  territoryType?: number;
  password?: string;
  cpassword?: string;
  propertyPostal?: string;
  instructions?: string;
  linkid?: string;
  linkExpiryHrs?: number;
}

export type adminProps = userInterface;

export interface territoryDetails extends nameInterface {
  id: string;
  code: string;
}

export interface addressDetails
  extends nameInterface,
    territoryInterface,
    postalInterface,
    mapInterface {
  floors: Array<floorDetails>;
  feedback: string;
  type: number;
  instructions: string;
  aggregate: number;
  done: number;
  notdone: number;
  nothome: number;
}

export interface FormProps {
  handleChange?: (event: React.ChangeEvent<HTMLElement>) => void;
  handleGroupChange?: (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    value: string | null
  ) => void;
  handleChangeValues?: (values: string[]) => void;
  handleDateChange?: (date: Date) => void;
  changeDate?: number;
  changeValue?: number | string;
  changeValues?: string[];
  name?: string;
  label?: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  information?: string;
  inputType?: string;
  readOnly?: boolean;
  focus?: boolean;
}

export interface FloorProps {
  handleChange?: (
    event: Event,
    value: number | number[],
    activeThumb: number
  ) => void;
  changeValue: number;
}

export interface TitleProps extends nameInterface {
  unit: string;
  postal?: string;
  type?: number;
  propertyPostal?: string;
  floorDisplay?: string;
}

export interface CongregationProps {
  id: string;
  acl: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  congregation: any;
}

export interface BrandingProps {
  naming: string;
}

export interface FooterProps {
  isSaving?: boolean;
  disableSubmitBtn?: boolean;
  userAccessLevel?: number;
  requiredAcLForSave?: number;
  submitLabel?: string;
  handleClick?: (event: React.MouseEvent<HTMLElement>) => void;
  children?: React.ReactNode;
}

export interface SubmitBtnProps {
  isSaving: boolean;
  btnLabel?: string;
  disabled?: boolean;
}

export interface InstructionsProps {
  instructions: string;
  userAcl?: number;
  handleSave: (event: React.MouseEvent<HTMLElement>) => void;
}

export interface LegendProps {
  showLegend: boolean;
  hideFunction?: () => void;
}

export interface TerritoryListingProps {
  showListing: boolean;
  hideFunction: () => void;
  selectedTerritory?: string;
  handleSelect?: (
    eventKey: string | null,
    e: React.SyntheticEvent<unknown>
  ) => void;
  territories?: territoryDetails[];
  hideSelectedTerritory?: boolean;
}

export interface LoginProps {
  loginType: string;
}

export interface unitMaps {
  [key: string]: object | number | string;
}

export interface RouteDetails extends nameInterface, postalInterface {}

export interface AuthorizerProp {
  requiredPermission: number;
  userPermission: number | undefined;
  children: React.ReactElement;
}

export interface aggregateProp {
  aggregate?: number;
  isDataFetched?: boolean;
}

export interface ExpiryButtonProp {
  endtime: number;
}

export interface floorHeaderProp extends floorInterface {
  index: number;
}

export interface tableHeaderProp {
  floors: Array<floorDetails>;
  maxUnitNumber: number;
}

export interface territoryHeaderProp {
  name: string | undefined;
}

export interface backToTopProp {
  showButton: boolean;
}

export interface territoryTableProps extends postalInterface {
  floors: floorDetails[];
  maxUnitNumberLength: number;
  policy: Policy | undefined;
  completedPercent: {
    completedValue: number;
    completedDisplay: string;
  };
  userAccessLevel?: number;
  territoryType?: number;
  handleUnitStatusUpdate: (event: React.MouseEvent<HTMLElement>) => void;
  handleUnitNoUpdate?: (event: React.MouseEvent<HTMLElement>) => void;
  handleFloorDelete?: (event: React.MouseEvent<HTMLElement>) => void;
}

export interface territoryLandedProps extends postalInterface {
  isAdmin: boolean;
  houses: floorDetails;
  policy: Policy | undefined;
  completedPercent: {
    completedValue: number;
    completedDisplay: string;
  };
  adminUnitHeaderStyle?: string;
  userAccessLevel?: number;
  handleHouseUpdate: (event: React.MouseEvent<HTMLElement>) => void;
}

export interface SignInDifferentProps {
  name?: string;
  handleClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

export interface VerificationProps extends SignInDifferentProps {
  handleResendMail?: (event: React.MouseEvent<HTMLElement>) => void;
}

export interface HelpButtonProps {
  link: string;
  isWarningButton?: boolean;
}

export interface userDetails extends nameInterface {
  uid: string;
  email: string;
  verified: boolean;
  role: number;
}

export interface UserListingProps {
  showListing: boolean;
  hideFunction: () => void;
  currentUid?: string;
  handleSelect?: (
    eventKey: string | null,
    e: React.SyntheticEvent<unknown>
  ) => void;
  users?: userDetails[];
}

export interface UserRoleProps {
  handleRoleChange?: (
    value: number,
    event: React.ChangeEvent<HTMLElement>
  ) => void;
  role?: number;
  isUpdate?: boolean;
}

export interface UserModalProps
  extends nameInterface,
    congregationInterface,
    footerInterface {
  email?: string | null;
  uid?: string;
  role?: number | undefined;
}

export interface SelectProps {
  value: string;
  label: string;
}

export interface OptionProps {
  code: string;
  description: string;
}

export interface HouseholdProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleChange?: any;
  changeValue?: string;
  options: Array<SelectProps>;
  isMultiselect?: boolean;
}

export interface HHOptionProps {
  id: string;
  code: string;
  description: string;
  isCountable: boolean;
  isDefault?: boolean;
  sequence: number;
  isNew?: boolean;
}

export interface EnvironmentIndicatorProps {
  environment: string;
}

export interface UserRoleBadgeProps {
  role: number | undefined;
}

export type CongUsersProps = congregationInterface;

export type WelcomeProps = nameInterface;
export interface AssignmentModalProps extends congregationInterface {
  assignments: LinkSession[];
  assignmentType?: number;
  assignmentTerritory?: string;
}

export interface ConfirmationModalProps {
  title: string;
  message: string;
}

export interface ChangeAddressNameModalProps
  extends nameInterface,
    footerInterface,
    congregationInterface,
    mapInterface,
    territoryInterface {}

export interface ChangePasswordModalProps extends userInterface {
  userAccessLevel: number | undefined;
}

export interface ChangeAddressPostalCodeModalProps
  extends postalInterface,
    mapInterface,
    congregationInterface,
    footerInterface {}

export interface ChangeMapLocationModalProps
  extends mapInterface,
    congregationInterface,
    footerInterface {
  name: string;
}

export interface ChangeTerritoryCodeModalProps
  extends congregationInterface,
    footerInterface,
    territoryInterface {
  territoryCode: string;
}

export interface ChangeTerritoryNameModalProps
  extends congregationInterface,
    territoryInterface,
    footerInterface {
  name: string | undefined;
}

export interface UpdateCongregationOptionsModalProps {
  currentCongregation: string;
}

export interface UpdateMapTerritoryModalProps
  extends mapInterface,
    congregationInterface,
    territoryInterface {
  territories: Array<territoryDetails>;
}

export interface UpdateCongregationSettingsModalProps {
  currentName: string;
  currentCongregation: string;
  currentMaxTries: number;
  currentDefaultExpiryHrs: number;
  currentIsMultipleSelection: boolean;
}

export interface UpdateAddressInstructionsModalProps
  extends mapInterface,
    congregationInterface {
  addressName: string;
  userAccessLevel: number | undefined;
  instructions: string | undefined;
  userName: string;
}

export interface NewPrivateAddressModalProps
  extends congregationInterface,
    territoryInterface,
    mapInterface,
    footerInterface {
  defaultType: string;
}

export type NewPublicAddressModalProps = NewPrivateAddressModalProps;

export interface NewTerritoryCodeModalProps
  extends congregationInterface,
    footerInterface {}

export interface NewUnitModalProps
  extends mapInterface,
    footerInterface,
    congregationInterface {
  addressData: addressDetails;
  addressName: string;
  defaultType: string;
}

export type UpdateProfileModalProps = userInterface;

export interface ConfirmSlipDetailsModalProps {
  addressName: string;
  userAccessLevel: number | undefined;
  defaultExpiryHrs: number;
  maxSequence: number;
  maxFloor: number;
  type: number;
}

export interface SliderMark {
  value: number;
  label: string;
}

export interface UpdateAddressFeedbackModalProps
  extends nameInterface,
    congregationInterface,
    footerInterface,
    mapInterface,
    territoryInterface {
  helpLink: string;
  currentFeedback: string;
  currentName: string;
}

export interface UpdateAddressStatusModalProps
  extends postalInterface,
    congregationInterface,
    floorInterface,
    updateInterface {
  addressName: string | undefined;
  userAccessLevel: number | undefined;
  territoryType: number | undefined;
  unitNo: string;
  unitNoDisplay: string;
  addressData: addressDetails | undefined;
  unitDetails: unitDetails | undefined;
  options: Array<OptionProps>;
  defaultOption: string;
  isMultiselect: boolean;
  addressId: string;
}

export interface UpdateUnitModalProps
  extends mapInterface,
    nameInterface,
    congregationInterface {
  unitSequence: number | undefined;
  unitLength: number;
  unitNo: string;
  unitDisplay: string;
  addressData: addressDetails;
}

// export interface AlertSnackbarProps {
//   setStateAction<{
//     open: boolean;
//     message: string;
//     color: "success" | "warning" | "info" | "danger";
//   }>;
// }

export interface AlertSnackbarProps {
  setSnackbarAlert: React.Dispatch<React.SetStateAction<SnackbarAlertType>>;
}

export interface SnackbarAlertType {
  open: boolean;
  message: string;
  color: string;
}
