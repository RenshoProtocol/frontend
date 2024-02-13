import usePositionsHistory from "../../hooks/usePositionsHistory";
import HistoryTx from "./historyTx";

const PositionsHistory = ({ account, refresh }) => {
  
  const thStyle = {
    color: "#94A3B8",
    fontWeight: 500,
    textDecorationStyle: "dotted",
    textDecorationStyle: 'dotted', 
    textDecorationColor: 'grey',
    textDecorationLine: 'underline'
  }
  
  const history = usePositionsHistory(account, refresh);
  console.log('historor', history)

  return (<>
        {
          history ? [...history].reverse().map( tx => {
            return (<HistoryTx key={tx.transactionHash} tx={tx}  />);
          }) : <></>
        }
  </>)
}

export default PositionsHistory;