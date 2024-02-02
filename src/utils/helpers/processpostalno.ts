import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { firestore } from "../../firebase";
import {
  STATUS_CODES,
  NOT_HOME_STATUS_CODES,
  MULTI_BATCH_ACTIONS
} from "../constants";
import { addressDetails } from "../interface";
import MultiBatchHandler from "./multibatchupdate";
import MultiBatchSetter from "./multibatchcreate";

const processPostalUnitNumber = async (
  congregationCode: string,
  mapId: string,
  unitNumber: string,
  addressData: addressDetails | undefined,
  isDelete = false,
  defaultType?: string
) => {
  if (!addressData) return;

  const existingUnitNo = await getDocs(
    query(
      collection(firestore, `congregations/${congregationCode}/addresses`),
      where("map", "==", mapId),
      where("number", "==", unitNumber),
      limit(1)
    )
  );
  if (!isDelete) {
    if (!existingUnitNo.empty) {
      alert(`Unit number, ${unitNumber} already exist.`);
      return;
    }
  }
  if (isDelete) {
    await MultiBatchHandler(
      query(
        collection(firestore, `congregations/${congregationCode}/addresses`),
        where("map", "==", mapId),
        where("number", "==", unitNumber)
      ),
      MULTI_BATCH_ACTIONS.DELETE
    );
    return;
  }
  const setListing = [];
  const lastSequenceNo = addressData.floors[0].units.length + 1;
  for (const index in addressData.floors) {
    const floorDetails = addressData.floors[index];
    setListing.push({
      map: mapId,
      territory: addressData.territoryId,
      number: unitNumber,
      type: defaultType,
      note: "",
      status: STATUS_CODES.DEFAULT,
      nhcount: NOT_HOME_STATUS_CODES.DEFAULT,
      floor: floorDetails.floor,
      sequence: lastSequenceNo
    });
  }
  await MultiBatchSetter(
    collection(firestore, `congregations/${congregationCode}/addresses`),
    setListing
  );
};

export default processPostalUnitNumber;
