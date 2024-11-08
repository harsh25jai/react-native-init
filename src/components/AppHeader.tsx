import { FC, PropsWithChildren, ReactNode } from "react";
import { StyleSheet, Text, TextStyle, useColorScheme, View, ViewProps, ViewStyle } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { Fonts } from "../core/Fonts";

interface AppHeaderParams {
    title: string | null;
    variant?: string | null;
    left?: ReactNode;
    right?: ReactNode;
    props?: ViewProps;
    titleStyle?: TextStyle;
    style?: ViewStyle;
}

const AppHeader: FC<PropsWithChildren<AppHeaderParams>> = ({ title, variant, left, right, titleStyle, style, props }) => {
    const isDarkMode = useColorScheme() === 'dark';

    const backgroundColor = isDarkMode ? Colors.darker : Colors.lighter;
    const textColor = isDarkMode ? Colors.white : Colors.dark;

    return (
        <View style={[styles.container, { backgroundColor: backgroundColor }, style]} {...props}>
            {left}
            <Text style={[styles.titleText, { color: textColor }, titleStyle]}>{title}</Text>
            {right}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        margin: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleText: {
        width: '80%',
        marginHorizontal: 10,
        textAlign: 'center',
        fontSize: 28,
        fontFamily: Fonts.Medium
    }
});

export default AppHeader;