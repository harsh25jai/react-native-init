import renderer from 'react-test-renderer';
import { render, screen, waitFor } from '@testing-library/react-native';
import { fetch_retry, GET } from "../../core/APIServices";
import Bitcoin, { getBTCData } from ".";
import { BTC_Ticker } from '../../core/Urls';

jest.mock('../../utils/APIServices');

describe('Bitcoin', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Clear previous mock calls
    });
    
    it('defined correctly', () => {
        expect(Bitcoin).toBeDefined;
    });

    it('renders correctly', () => {
        const wrapper = renderer.create(<Bitcoin />);
        expect(wrapper).toMatchSnapshot();
    });

    it('API calls correctly', async () => {
        expect(fetch_retry).toHaveBeenCalledWith({ endpoint: BTC_Ticker, method: GET });
    });
})