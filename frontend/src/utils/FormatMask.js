import React from 'react';
import Flag from 'react-world-flags'; // Biblioteca para exibir as bandeiras
import { TableCell } from '@mui/material'; // Importação correta do TableCell
import { parsePhoneNumberFromString } from 'libphonenumber-js'; // Importando a libphonenumber-js

class FormatMask {
    setPhoneFormatMask(phoneToFormat) {
        if (!phoneToFormat) {
            return "Número não disponível"; // Retorna caso o número seja inválido ou não existam
        }

        // Remove caracteres não numéricos
        const number = phoneToFormat.replace(/\D/g, "");

        // Verifica se o número tem pelo menos 10 dígitos
        if (number.length < 10) {
            return "Número inválido"; // Número inválido com menos de 10 dígitos
        }

        // Verifica se o número já contém um código de país
        let formattedPhoneNumber = phoneToFormat;
        if (!formattedPhoneNumber.startsWith("+")) {
            // O número não contém um código de país, a função irá detectá-lo
            formattedPhoneNumber = "+" + number;
        }

        // Tenta parsear o número com a libphonenumber-js
        const parsedPhoneNumber = parsePhoneNumberFromString(formattedPhoneNumber);

        if (!parsedPhoneNumber || !parsedPhoneNumber.isValid()) {
            return "Número inválido"; // Caso o número não seja válido
        }

        // Obter o código do país
        const countryCode = parsedPhoneNumber.country;
        const countryName = this.getCountryName(countryCode); // Traduz o nome do país

        // Formatação do número com DDD entre parênteses
        const formattedNumber = parsedPhoneNumber.formatNational();
        const formattedWithDDD = formattedNumber.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');

        // Retorna o JSX com a bandeira, nome do país traduzido e número formatado
        return (
            <TableCell 
                align="center" 
                style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    wordBreak: 'break-word', // Quebra de palavras longa, caso o número seja longo
                    textAlign: 'center',
                    whiteSpace: 'normal', // Impede que o texto fique em uma linha só, caso o número seja grande
                    border: 'none', // Remove qualquer borda indesejada
                    textDecoration: 'none', // Remove sublinhado, se houver
                }}
            >
                <Flag 
                    code={countryCode} 
                    style={{ width: 30, height: 20, marginRight: 8 }} 
                    title={countryName} // Tooltip com o nome do país traduzido
                />
                <span>{`+${parsedPhoneNumber.countryCallingCode} ${formattedWithDDD}`}</span>
            </TableCell>
        );
    }

    removeMask(number) {
        // Remove todos os caracteres não numéricos
        return number.replace(/\D/g, "");
    }

    maskPhonePattern(phoneNumber) {
        // Máscara genérica que pode ser ajustada automaticamente para o país do número
        return phoneNumber.length <= 12 ? '+XX (XX) XXXX XXXX' : '+XX (XX) XXXXX XXXX';
    }

    getCountryName(countryCode) {
        try {
            // Cria uma instância do DisplayNames para obter os nomes dos países traduzidos
            const displayNames = new Intl.DisplayNames(
                // Omitir o idioma ou usar 'pt-BR' para garantir que o nome do país seja exibido em português
                ['pt-BR'], // Usando português para tradução
                { type: 'region' }
            );
            // Retorna o nome do país traduzido
            return displayNames.of(countryCode);
        } catch (error) {
            // Se houver erro, retorna o nome do código de país (fallback)
            return countryCode;
        }
    }
}

export { FormatMask };