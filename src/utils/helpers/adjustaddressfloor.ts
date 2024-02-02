import {
  collection,
  where,
  getDocs,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import { firestore } from "../../firebase";
import { NOT_HOME_STATUS_CODES, STATUS_CODES } from "../constants";
import MultiBatchSetter from "./multibatchcreate";
const adjustAddressFloor = async (
  congregation: string,
  mapId: string,
  defaultType: string,
  higherFloor = true
) => {
  // query to get 1 record from the addresses collection sorted by highest floor
  const isAscending = higherFloor ? "desc" : "asc";
  const floorAddress = await getDocs(
    query(
      collection(firestore, `congregations/${congregation}/addresses`),
      where("map", "==", mapId),
      orderBy("floor", isAscending),
      limit(1)
    )
  );

  // get floor of the first record
  const floor = floorAddress.docs[0].data().floor;

  const querySnapshot = await getDocs(
    query(
      collection(firestore, `congregations/${congregation}/addresses`),
      where("map", "==", mapId),
      where("floor", "==", floor),
      orderBy("sequence", "asc")
    )
  );

  const setListing = [];
  for (const qdoc of querySnapshot.docs) {
    const newFloor = higherFloor
      ? qdoc.data().floor + 1
      : qdoc.data().floor - 1 < 0
      ? qdoc.data().floor - 1
      : -1;

    const newDoc = {
      ...qdoc.data(),
      floor: newFloor,
      status: STATUS_CODES.DEFAULT,
      type: defaultType,
      note: "",
      nhcount: NOT_HOME_STATUS_CODES.DEFAULT
    };
    setListing.push(newDoc);
  }
  await MultiBatchSetter(
    collection(firestore, `congregations/${congregation}/addresses`),
    setListing
  );
};

export default adjustAddressFloor;
