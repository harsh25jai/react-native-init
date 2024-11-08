import { FC, PropsWithChildren, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { fetch_retry, GET } from "../../core/APIServices";
import { BTC_Ticker } from "../../core/Urls";
import { AppIcon, AppHeader } from "@components";

const Bitcoin: FC<PropsWithChildren<{ navigation: any, route: any }>> = ({ navigation, route }) => {
    const [btcData, setBtcData] = useState([]);

    const getBTCData = async () => {
        const resp = await fetch_retry({ endpoint: BTC_Ticker, method: GET });
        if (resp?.success) {
            setBtcData(resp?.response);
        } else {
            console.log('getBTCData Error', resp?.error)
        }
        return resp;
        // Response Fields
        // Index	Field	                Type	Description
        // [0]	    BID	                    float	Price of last highest bid
        // [1]	    BID_SIZE	            float	Sum of the 25 highest bid sizes
        // [2]	    ASK	                    float	Price of last lowest ask
        // [3]	    ASK_SIZE	            float	Sum of the 25 lowest ask sizes
        // [4]	    DAILY_CHANGE	        float	Amount that the last price has changed since yesterday
        // [5]	    DAILY_CHANGE_RELATIVE	float	Relative price change since yesterday (*100 for percentage change)
        // [6]	    LAST_PRICE	            float	Price of the last trade
        // [7]	    VOLUME	                float	Daily volume
        // [8]	    HIGH	                float	Daily high
        // [9]	    LOW	                    float	Daily low

    }

    useEffect(() => {
        const intervalID = setInterval(() => {
            // console.log('API Called')
            getBTCData();
        }, 3000)

        return (() => clearInterval(intervalID));
    }, [])

    return (
        <View style={styles.container}>
            <AppHeader
                title={"Bitcoin"}
                left={<AppIcon iconFamily="Feather" name="arrow-left-circle" size={28}  />}
                props={{ testID: "Bitcoin-Header", accessibilityLabel: "Bitcoin-Header",  }} />

            <Text>BID $ {btcData[0]}</Text>
            <Text>BID Size $ {btcData[1]}</Text>
            <Text>ASk $ {btcData[2]}</Text>
            <Text>ASK Size $ {btcData[3]}</Text>
            <Text>DAILY Change $ {btcData[4]}</Text>
            <Text>Daily Change Percentage {(btcData[5] * 100).toFixed(2)}</Text>
            <Text>Price $ {btcData[6]}</Text>
            <Text>Volume $ {btcData[7]}</Text>
            <Text>High $ {btcData[8]}</Text>
            <Text>Low $ {btcData[9]}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    titleText: {
        margin: 5,
        fontSize: 24,
        textAlign: 'center'
    }
});

export default Bitcoin;