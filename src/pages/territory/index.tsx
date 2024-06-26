import { useState, useEffect, lazy, useCallback } from "react";
import { firestore } from "../../firebase";
import { useParams } from "react-router-dom";
import Slip from "./slip";
import { LinkSession } from "../../utils/policies";
import Loader from "../../components/statics/loader";
import { DEFAULT_CONGREGATION_MAX_TRIES } from "../../utils/constants";
import { doc, getDoc } from "firebase/firestore";
const InvalidPage = lazy(() => import("../../components/statics/invalidpage"));

function Territory() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLinkExpired, setIsLinkExpired] = useState<boolean>(true);
  const [tokenEndTime, setTokenEndTime] = useState<number>(0);
  const [publisherName, setPublisherName] = useState<string>("");
  const [congregationMaxTries, setCongregationMaxTries] = useState<number>(
    DEFAULT_CONGREGATION_MAX_TRIES
  );
  const [congregation, setCongregation] = useState<string>("");
  const [map, setMap] = useState<string>("");

  const [lowestFloor, setLowestFloor] = useState<number>(0);
  const [highestFloor, setHighestFloor] = useState<number>(0);
  const [lowestSequence, setLowestSequence] = useState<number>(0);
  const [highestSequence, setHighestSequence] = useState<number>(0);

  const prepareTerritory = useCallback(async () => {
    try {
      const linkRef = doc(firestore, `links/${id}`);
      const linkSnapshot = await getDoc(linkRef);
      if (!linkSnapshot.exists()) {
        console.error(`Link ${id} does not exist!`);
        return;
      }

      const linkrec = new LinkSession(linkSnapshot.data());

      setPublisherName(linkrec.publisher_name);
      setCongregationMaxTries(linkrec.max_tries);
      setMap(linkrec.map);
      setCongregation(linkrec.congregation);
      const tokenEndtime = linkrec.end_date;
      const currentTimestamp = new Date().getTime();
      const endTimestamp = new Date(tokenEndtime).getTime();
      console.log(
        `start: ${new Date(linkrec.create_date)}, end: ${new Date(
          tokenEndtime
        )}`
      );
      setTokenEndTime(tokenEndtime);
      setIsLinkExpired(currentTimestamp > endTimestamp);
      setLowestFloor(linkrec.lowest_floor);
      setHighestFloor(linkrec.highest_floor);
      setLowestSequence(linkrec.lowest_sequence);
      setHighestSequence(linkrec.highest_sequence);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    prepareTerritory();
  }, []);
  if (isLoading) return <Loader />;
  if (isLinkExpired) {
    document.title = "Ministry Mapper";
    return <InvalidPage />;
  }
  console.log(`tokenEndTime: ${tokenEndTime}, is expired: ${isLinkExpired}`);
  return (
    <Slip
      tokenEndtime={tokenEndTime}
      mapId={map}
      congregationcode={congregation}
      maxTries={congregationMaxTries}
      pubName={publisherName}
      lowestFloor={lowestFloor}
      highestFloor={highestFloor}
      lowestSequence={lowestSequence}
      highestSequence={highestSequence}
    ></Slip>
  );
}

export default Territory;
