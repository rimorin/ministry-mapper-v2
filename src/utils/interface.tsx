import { AuthModel } from "pocketbase";
import { LinkSession, Policy } from "./policies";
import { Value } from "react-calendar/dist/cjs/shared/types";
export interface userInterface {
  user: AuthModel;
}

interface nameInterface {
  name: string;
}

interface mapInterface {
  mapId: string;
}

interface mapCodeInterface {
  mapCode: string;
}

interface congregationInterface {
  congregation: string;
}

interface footerInterface {
  footerSaveAcl: string;
}

interface floorInterface {
  floor: number;
  floorDisplay?: string;
}

export interface typeInterface {
  id: string;
  code: string;
}

export interface unitDetails {
  id: string;
  number: string;
  note: string;
  type: typeInterface[];
  status: string;
  nhcount: string;
  dnctime: number;
  floor: number;
  sequence: number;
  coordinates?: latlongInterface;
  updated?: number;
  updatedBy?: string;
}

export interface nothomeProps {
  nhcount?: string;
  classProp?: string;
}

export interface floorDetails extends floorInterface {
  units: Array<unitDetails>;
}

export interface unitProps {
  type: typeInterface[];
  note?: string;
  status: string;
  nhcount?: string;
  defaultOption?: string;
}

export interface valuesDetails extends floorInterface, nameInterface {
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
  map?: string;
}

export type DropDirection = "up" | "down";
export type DropDirections = { [key: string]: DropDirection };

export type adminProps = userInterface;

export interface territoryDetails extends nameInterface {
  id: string;
  code: string;
  aggregates: number;
}

export interface addressDetails
  extends nameInterface,
    mapInterface,
    coordinatesInterface {
  id: string;
  assigneeDetailsList: Array<LinkSession>;
  personalDetailsList: Array<LinkSession>;
  floors: Array<floorDetails>;
  type: string;
  location?: string;
  aggregates: AggregatesProps;
}

export interface FormProps {
  handleChange?: (event: React.ChangeEvent<HTMLElement>) => void;
  handleClick?: (event: React.MouseEvent<HTMLElement>) => void;
  handleGroupChange?: (
    value: string,
    event: React.ChangeEvent<HTMLElement>
  ) => void;
  handleChangeValues?: (values: string[]) => void;
  handleDateChange?: (date: Value) => void;
  changeDate?: number;
  changeValue?: string;
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
  handleChange?: (event: React.ChangeEvent<HTMLElement>) => void;
  changeValue: number;
}

export interface TitleProps extends nameInterface, floorInterface {
  unit: string;
  type?: string;
}

export interface BrandingProps {
  naming: string;
}

export interface FooterProps {
  isSaving?: boolean;
  disableSubmitBtn?: boolean;
  userAccessLevel?: string;
  requiredAcLForSave?: string;
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
  userAcl?: string;
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

export interface RouteDetails extends nameInterface, mapInterface {}

export interface AuthorizerProp {
  requiredPermission: string;
  userPermission: string | undefined;
  children: React.ReactElement;
}

export interface aggregateBadgeProp {
  aggregate?: number;
  width?: string;
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

export interface territoryTableProps {
  mapView?: boolean;
  policy: Policy;
  addressDetails: addressDetails;
  assignmentId?: string;
  handleUnitStatusUpdate?: (event: React.MouseEvent<HTMLElement>) => void;
  handleUnitNoUpdate?: (event: React.MouseEvent<HTMLElement>) => void;
  handleFloorDelete?: (event: React.MouseEvent<HTMLElement>) => void;
}

export interface territoryMultiProps {
  floors: floorDetails[];
  addressDetails: addressDetails;
  policy: Policy;
  maxUnitLength: number;
  handleUnitStatusUpdate: (event: React.MouseEvent<HTMLElement>) => void;
  handleFloorDelete?: (event: React.MouseEvent<HTMLElement>) => void;
  handleUnitNoUpdate?: (event: React.MouseEvent<HTMLElement>) => void;
}

export interface territorySingleProps {
  houses: floorDetails;
  policy: Policy;
  addressDetails: addressDetails;
  handleHouseUpdate: (
    event: React.MouseEvent<HTMLElement> | google.maps.MapMouseEvent
  ) => void;
}

export interface SignInDifferentProps {
  name?: string;
  handleClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

export interface HelpButtonProps {
  link: string;
  isWarningButton?: boolean;
}

export interface userDetails extends nameInterface {
  email: string;
  verified: boolean;
  role: string;
  roleId: string;
}

export type CongregationAccessObject = {
  code: string;
  name: string;
  access: string;
};

export interface CongregationListingProps {
  showListing: boolean;
  hideFunction: () => void;
  currentCongCode: string;
  handleSelect?: (
    eventKey: string | null,
    e: React.SyntheticEvent<unknown>
  ) => void;
  congregations?: CongregationAccessObject[];
}

export interface UserListingProps {
  showListing: boolean;
  hideFunction: () => void;
  handleSelect?: (
    eventKey: string | null,
    e: React.SyntheticEvent<unknown>
  ) => void;
  users?: userDetails[];
}

export interface UserRoleProps {
  handleRoleChange?: (
    value: string,
    event: React.ChangeEvent<HTMLElement>
  ) => void;
  role?: string;
  isUpdate?: boolean;
}

export interface UserModalProps
  extends nameInterface,
    congregationInterface,
    footerInterface {
  email?: string | null;
  uid: string;
  role?: string | undefined;
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
  changeValue?: typeInterface[];
  options: Array<SelectProps>;
}

export interface HHOptionProps {
  id: string;
  code: string;
  description: string;
  isCountable: boolean;
  isDefault?: boolean;
  sequence: number;
  isNew?: boolean;
  isDeleted?: boolean;
}

export interface EnvironmentIndicatorProps {
  environment: string;
}

export interface UserRoleBadgeProps {
  role: string | undefined;
}

export type WelcomeProps = nameInterface;
export interface AssignmentModalProps extends congregationInterface {
  assignments: LinkSession[];
  assignmentType?: string;
  assignmentTerritory?: string;
}

export interface ChangeAddressNameModalProps
  extends nameInterface,
    footerInterface,
    congregationInterface,
    mapInterface {}

export interface ChangePasswordModalProps extends userInterface {
  userAccessLevel: string | undefined;
}

export interface ChangeAddressMapCodeModalProps
  extends mapInterface,
    mapCodeInterface,
    footerInterface {
  territoryCode: string | undefined;
}

export interface ChangeAddressLocationModalProps
  extends mapInterface,
    congregationInterface,
    footerInterface {
  location: string | undefined;
}

export interface latlongInterface {
  lat: number;
  lng: number;
}

export interface coordinatesInterface {
  coordinates: latlongInterface;
}

export interface originInterface {
  origin: string;
}

export interface ConfigureAddressCoordinatesModalProps
  extends mapInterface,
    congregationInterface,
    footerInterface,
    coordinatesInterface,
    nameInterface,
    originInterface {
  isNew: boolean;
}

export interface GetMapGeolocationModalProps
  extends coordinatesInterface,
    originInterface,
    nameInterface {}

export interface NewAddressCoordinatesModalProps
  extends coordinatesInterface,
    originInterface {}

export interface ChangeTerritoryCodeModalProps
  extends congregationInterface,
    footerInterface {
  territoryCode: string;
  territoryId: string;
}

export interface ChangeTerritoryNameModalProps
  extends congregationInterface,
    footerInterface {
  name: string | undefined;
  territoryCode: string;
}

export interface UpdateCongregationOptionsModalProps {
  currentCongregation: string;
}

export interface UpdateCongregationSettingsModalProps {
  currentName: string;
  currentCongregation: string;
  currentMaxTries: number;
  currentDefaultExpiryHrs: number;
  currentIsMultipleSelection: boolean;
}

export interface NewPrivateAddressModalProps
  extends congregationInterface,
    footerInterface,
    originInterface {
  territoryCode: string;
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
  defaultType: string;
}

export type UpdateProfileModalProps = userInterface;

export interface ConfirmSlipDetailsModalProps {
  addressName: string;
  userAccessLevel: string | undefined;
  isPersonalSlip: boolean;
}

export interface UpdateAddressFeedbackModalProps
  extends nameInterface,
    mapInterface,
    footerInterface {
  helpLink: string;
  currentName: string;
  policy: Policy;
  messageType: string;
  messages: Array<Message>;
  assignmentId?: string;
}

export interface UpdateAddressStatusModalProps
  extends mapInterface,
    congregationInterface,
    floorInterface,
    originInterface {
  addressName: string | undefined;
  userAccessLevel: number | undefined;
  territoryType: number | undefined;
  unitNo: string;
  unitNoDisplay: string;
  addressData: addressDetails | undefined;
  unitDetails: unitDetails;
  options: Array<OptionProps>;
  defaultOption: string;
  policy: Policy;
}

export interface UpdateUnitModalProps
  extends mapInterface,
    congregationInterface {
  mapName: string;
  unitSequence: number | undefined;
  unitLength: number;
  unitNo: string;
  unitDisplay: string;
  addressData: addressDetails;
}

export interface AggregatesProps {
  value: number;
  display: string;
  notHome: number;
  notDone: number;
}

export interface Message {
  id: string;
  message: string;
  read: boolean;
  pinned: boolean;
  created: Date;
  created_by: string;
  type: string;
}
