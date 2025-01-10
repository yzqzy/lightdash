import {
    DbtVersionOption,
    getLatestSupportDbtVersion,
    ParseError,
    SupportedDbtVersions,
} from '@lightdash/common';
import execa from 'execa';
import inquirer from 'inquirer';
import GlobalState from '../../globalState';
import * as styles from '../../styles';

const DBT_CORE_VERSION_REGEX = /installed:.*/;

const getDbtCLIVersion = async () => {
    try {
        const { all } = await execa('dbt', ['--version'], {
            all: true,
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        const logs = all || '';
        const version = logs.match(DBT_CORE_VERSION_REGEX);
        if (version === null || version.length === 0)
            throw new ParseError(`Can't locate dbt --version: ${logs}`);
        return version[0].split(':')[1].trim();
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '-';
        throw new ParseError(`Failed to get dbt --version:\n  ${msg}`);
    }
};

const getSupportedDbtVersionOption = (
    version: string,
): DbtVersionOption | null => {
    if (version.startsWith('1.4.')) return SupportedDbtVersions.V1_4;
    if (version.startsWith('1.5.')) return SupportedDbtVersions.V1_5;
    if (version.startsWith('1.6.')) return SupportedDbtVersions.V1_6;
    if (version.startsWith('1.7.')) return SupportedDbtVersions.V1_7;
    if (version.startsWith('1.8.')) return SupportedDbtVersions.V1_8;
    if (version.startsWith('1.9.')) return SupportedDbtVersions.V1_9;

    // No supported version found
    return null;
};

const getFallbackDbtVersionOption = (version: string): DbtVersionOption => {
    if (version.startsWith('1.3.')) return SupportedDbtVersions.V1_4; // legacy|deprecated support for dbt 1.3
    return getLatestSupportDbtVersion();
};

type DbtVersion = {
    verboseVersion: string; // Verbose version returned by dbt --version
    versionOption: DbtVersionOption; // The supported version by Lightdash
};

export const getDbtVersion = async (): Promise<DbtVersion> => {
    const verboseVersion = await getDbtCLIVersion();
    const supportedVersionOption = getSupportedDbtVersionOption(verboseVersion);
    const fallbackVersionOption = getFallbackDbtVersionOption(verboseVersion);
    const isSupported = !!supportedVersionOption;
    if (
        !isSupported &&
        !GlobalState.getSavedPromptAnswer('useFallbackDbtVersion')
    ) {
        const versions = Object.values(SupportedDbtVersions);
        const supportedVersionsRangeMessage = `${versions[0]}.* - ${
            versions[versions.length - 1]
        }.*`;
        const message = `We don't currently support version ${verboseVersion} on Lightdash. We'll interpret it as version ${fallbackVersionOption} instead, which might cause unexpected errors or behavior. For the best experience, please use a supported version (${supportedVersionsRangeMessage}).`;
        const spinner = GlobalState.getActiveSpinner();
        spinner?.stop();
        if (process.env.CI === 'true') {
            console.error(styles.warning(message));
        } else {
            const answers = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'isConfirm',
                    message: `${styles.warning(
                        message,
                    )}\nDo you still want to continue?`,
                },
            ]);
            if (!answers.isConfirm) {
                throw new Error(
                    `Unsupported dbt version ${verboseVersion}. Please consider using a supported version (${supportedVersionsRangeMessage}).`,
                );
            }
        }
        spinner?.start();
        GlobalState.savePromptAnswer('useFallbackDbtVersion', true);
    }

    return {
        verboseVersion,
        versionOption: supportedVersionOption ?? fallbackVersionOption,
    };
};
