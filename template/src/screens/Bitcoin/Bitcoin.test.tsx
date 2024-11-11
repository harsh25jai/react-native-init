import renderer from 'react-test-renderer';
import Bitcoin from ".";

describe('Bitcoin', () => {
    it('defined correctly', () => {
        expect(Bitcoin).toBeDefined;
    });

    it('renders correctly', () => {
        const wrapper = renderer.create(<Bitcoin />);
        expect(wrapper).toMatchSnapshot();
    });
})