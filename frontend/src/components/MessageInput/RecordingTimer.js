import React, { useState, useEffect, useRef } from "react";
import { makeStyles } from "@material-ui/core/styles";
import MicIcon from "@material-ui/icons/Mic"; // Ícone do microfone

const useStyles = makeStyles(theme => ({
	timerBox: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: "10px 20px",
		borderRadius: "20px",
		color: theme.mode === "light" ? theme.palette.primary.main : theme.palette.primary.contrastText, // Cor do texto com base no modo
	},
	timerText: {
		fontFamily: "'Roboto', sans-serif",
		marginRight: "10px", // Espaço entre o timer e o ícone
		fontSize: "1rem", // Tamanho da fonte reduzido
		fontWeight: "normal", // Remover negrito
	},
	microphone: {
		fontSize: "1.5rem", // Ícone do microfone menor
		color: theme.mode === "light" ? theme.palette.primary.main : theme.palette.primary.contrastText, // Cor do ícone com base no modo
		animation: "$pulse 1s infinite", // Animação de pulsação
	},
	"@keyframes pulse": {
		"0%": {
			opacity: 0.3,
		},
		"50%": {
			opacity: 1,
		},
		"100%": {
			opacity: 0.3,
		},
	},
}));

const RecordingTimer = () => {
	const classes = useStyles();
	const initialState = {
		minutes: 0,
		seconds: 0,
	};
	const [timer, setTimer] = useState(initialState);

	useEffect(() => {
		const interval = setInterval(
			() =>
				setTimer(prevState => {
					if (prevState.seconds === 59) {
						return { ...prevState, minutes: prevState.minutes + 1, seconds: 0 };
					}
					return { ...prevState, seconds: prevState.seconds + 1 };
				}),
			1000
		);
		return () => {
			clearInterval(interval);
		};
	}, []);

	const addZero = n => {
		return n < 10 ? "0" + n : n;
	};

	return (
		<div className={classes.timerBox}>
			<span className={classes.timerText}>{`${addZero(timer.minutes)}:${addZero(timer.seconds)}`}</span>
			<MicIcon className={classes.microphone} />
		</div>
	);
};

export default RecordingTimer;
